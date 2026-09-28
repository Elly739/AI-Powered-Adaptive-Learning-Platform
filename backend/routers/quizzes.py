from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from ast import literal_eval as py_eval
from database import get_db
from models import Quiz, Question, QuizAttempt, Answer, User, UserProgress
from schemas import (
    QuizCreate, QuizResponse, QuestionResponse, AdaptiveQuestion,
    AdaptiveQuizInitResponse, AdaptiveQuizNextResponse, AnswerSubmit,
    QuizAttemptResponse, QuestionCreate,
)
from auth import get_current_user
from adaptive_engine import AdaptiveEngine
from datetime import datetime

router = APIRouter(prefix="/quizzes", tags=["quizzes"])
engine = AdaptiveEngine()

def _question_to_schema(q: Question) -> AdaptiveQuestion:
    options = []
    if q.options:
        try:
            options = json.loads(q.options) if isinstance(q.options, str) else q.options
        except Exception:
            try:
                options = py_eval(q.options) if isinstance(q.options, str) else q.options
            except Exception:
                options = [q.options]
    return AdaptiveQuestion(
        question_id=q.id,
        question_text=q.question_text,
        options=options,
        difficulty_level=q.difficulty_level,
        topic=q.topic,
        explanation=q.explanation,
    )

@router.get("/", response_model=List[QuizResponse])
def list_quizzes(course_id: int = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = db.query(Quiz)
    if course_id:
        query = query.filter(Quiz.course_id == course_id)
    return query.all()

@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(quiz_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@router.post("/{quiz_id}/questions", response_model=QuestionResponse)
def add_question(quiz_id: int, q: QuestionCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    question = Question(**q.model_dump(), quiz_id=quiz_id, options=json.dumps(q.options))
    db.add(question)
    db.commit()
    db.refresh(question)
    return QuestionResponse.from_orm(question)

@router.post("/{quiz_id}/attempts/start", response_model=AdaptiveQuizInitResponse)
def start_attempt(quiz_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz or not quiz.questions:
        raise HTTPException(status_code=404, detail="Quiz not found or empty")

    profile = db.query(User).filter(User.id == user.id).first()
    start_difficulty = 0.5
    if profile:
        from models import LearningProfile
        lp = db.query(LearningProfile).filter(LearningProfile.user_id == user.id).first()
        if lp:
            start_difficulty = lp.preferred_difficulty

    attempt = QuizAttempt(
        user_id=user.id,
        quiz_id=quiz_id,
        score=None,
        max_score=None,
        time_taken=0,
        started_at=datetime.utcnow(),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    first_q = engine.select_next_question(
        db, quiz, start_difficulty, set()
    )
    questions = []
    if first_q:
        questions.append(_question_to_schema(first_q))

    return AdaptiveQuizInitResponse(
        attempt_id=attempt.id,
        quiz_id=quiz_id,
        questions=questions,
        current_difficulty=round(start_difficulty, 3),
    )

@router.post("/{quiz_id}/attempts/{attempt_id}/answer", response_model=AdaptiveQuizNextResponse)
def submit_answer(
    quiz_id: int, attempt_id: int, answer_data: AnswerSubmit,
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.user_id == user.id,
        QuizAttempt.quiz_id == quiz_id,
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    question = db.query(Question).filter(Question.id == answer_data.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = question.correct_answer.strip().lower() == answer_data.selected_answer.strip().lower()

    all_answers = db.query(Answer).filter(Answer.attempt_id == attempt_id).all()
    answered_ids = {a.question_id for a in all_answers}

    answer = Answer(
        attempt_id=attempt_id,
        question_id=answer_data.question_id,
        selected_answer=answer_data.selected_answer,
        is_correct=is_correct,
        response_time=5.0,
    )
    db.add(answer)
    db.flush()

    answered_ids.add(answer_data.question_id)

    all_answers = db.query(Answer).join(Question).filter(Answer.attempt_id == attempt_id).all()
    current_difficulty = engine.calculate_new_difficulty(
        question.difficulty_level, all_answers, {q.id: q for q in [a.question for a in all_answers]}
    )

    next_q = engine.select_next_question(db, attempt.quiz, current_difficulty, answered_ids, question.topic)

    is_complete = engine.should_complete_attempt(attempt)
    max_score = 0.0
    if is_complete:
        attempt.completed_at = datetime.utcnow()
        attempt.time_taken = (datetime.utcnow() - attempt.started_at).total_seconds()
        score_val, max_score_val = engine.compute_attempt_score(attempt)
        attempt.score = score_val
        attempt.max_score = max_score_val
        db.commit()
        db.refresh(attempt)
        engine.update_learning_profile(db, user.id, all_answers)
        return AdaptiveQuizNextResponse(
            attempt_id=attempt_id,
            question=None,
            is_complete=True,
            score=score_val,
            max_score=max_score_val,
            time_taken=attempt.time_taken,
        )

    result = AdaptiveQuizNextResponse(
        attempt_id=attempt_id,
        question=_question_to_schema(next_q) if next_q else None,
        is_complete=False,
        score=None,
        max_score=max_score,
        time_taken=None,
    )
    return result

@router.get("/{quiz_id}/attempts/{attempt_id}", response_model=QuizAttemptResponse)
def get_attempt(quiz_id: int, attempt_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id, QuizAttempt.user_id == user.id
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    return attempt

@router.get("/{quiz_id}/attempts", response_model=List[QuizAttemptResponse])
def list_attempts(quiz_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id, QuizAttempt.user_id == user.id
    ).all()
    return attempts
