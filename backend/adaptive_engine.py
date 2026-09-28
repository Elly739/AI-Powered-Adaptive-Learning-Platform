import statistics
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import List, Tuple, Optional
from models import (
    User, QuizAttempt, Answer, Question, Quiz, UserProgress,
    LearningProfile, StudySchedule, Course, Lesson,
    LearningStyle, ContentType,
)
from collections import defaultdict
import math


def _mean(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _std(values: List[float]) -> float:
    if len(values) < 2:
        return 0.0
    m = _mean(values)
    variance = sum((v - m) ** 2 for v in values) / (len(values) - 1)
    return math.sqrt(variance)


class AdaptiveEngine:
    """Core AI engine for adaptive learning: difficulty adjustment, style detection, scheduling."""

    def __init__(self, window_size: int = 5):
        self.window_size = window_size

    def calculate_new_difficulty(
        self, current_difficulty: float, answers: List[Answer], question_map: dict
    ) -> float:
        """
        Adjust question difficulty based on recent answer history using a sliding window.
        Correctly answers increase difficulty, incorrect ones decrease it.
        """
        if not answers:
            return 0.5

        recent = answers[-self.window_size:]
        correct_count = sum(1 for a in recent if a.is_correct)
        accuracy = correct_count / len(recent)

        response_times = [a.response_time for a in recent if a.response_time and a.response_time > 0]
        avg_response_time = _mean(response_times) if response_times else 5.0

        difficulty_delta = 0.15 * (accuracy - 0.5)

        if accuracy > 0.85 and avg_response_time < 8.0:
            difficulty_delta += 0.05

        if accuracy < 0.4 or avg_response_time > 20.0:
            difficulty_delta -= 0.10

        new_difficulty = max(0.1, min(0.9, current_difficulty + difficulty_delta))
        return round(new_difficulty, 3)

    def select_next_question(
        self, db: Session, quiz: Quiz, current_difficulty: float,
        answered_question_ids: set, topic_focus: Optional[str] = None
    ) -> Optional[Question]:
        """
        Select the next question closest to target difficulty that hasn't been answered yet.
        Prefers questions from the same topic for continuity.
        """
        candidates = [q for q in quiz.questions if q.id not in answered_question_ids]
        if not candidates:
            return None

        if topic_focus:
            topic_candidates = [q for q in candidates if q.topic == topic_focus]
            if topic_candidates:
                candidates = topic_candidates

        def difficulty_distance(q: Question) -> float:
            return abs(q.difficulty_level - current_difficulty)

        candidates.sort(key=difficulty_distance)
        return candidates[0]

    def detect_learning_style(
        self, db: Session, user_id: int, answers: List[Answer]
    ) -> Tuple[LearningStyle, float]:
        """
        Detect learning style from interaction patterns:
        - Fast response times with high accuracy => reading/writing
        - Slow but careful responses => auditory
        - Inconsistent timing => kinesthetic
        - Default => visual
        Returns (style, confidence_score).
        """
        if len(answers) < 5:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                try:
                    return LearningStyle(user.preferred_style), 0.3
                except ValueError:
                    pass
            return LearningStyle.VISUAL, 0.3

        response_times = [a.response_time for a in answers]
        is_correct = [1 if a.is_correct else 0 for a in answers]

        avg_response = _mean(response_times)
        std_response = _std(response_times)
        accuracy = _mean(is_correct)

        correct_rt = [a.response_time for a in answers if a.is_correct]
        incorrect_rt = [a.response_time for a in answers if not a.is_correct]

        fast_and_accurate = avg_response < 6.0 and accuracy > 0.7
        slow_but_accurate = avg_response > 10.0 and accuracy > 0.7
        inconsistent_timing = std_response > 8.0

        if fast_and_accurate:
            style = LearningStyle.READING_WRITING
            confidence = min(0.95, 0.4 + accuracy * 0.4 + (1 - min(avg_response / 10, 1)) * 0.15)
        elif slow_but_accurate and not inconsistent_timing:
            style = LearningStyle.AUDITORY
            confidence = min(0.9, 0.5 + accuracy * 0.3)
        elif inconsistent_timing:
            style = LearningStyle.KINESTHETIC
            confidence = min(0.85, 0.5 + accuracy * 0.2)
        else:
            style = LearningStyle.VISUAL
            confidence = min(0.8, 0.3 + accuracy * 0.3)

        return style, round(confidence, 3)

    def update_learning_profile(self, db: Session, user_id: int, answers: List[Answer]):
        """Update the user's learning profile with detected style and preferences."""
        profile = db.query(LearningProfile).filter(LearningProfile.user_id == user_id).first()

        if not profile:
            profile = LearningProfile(user_id=user_id)
            db.add(profile)
            db.flush()

        correct_answers = [a for a in answers if a.is_correct]
        accuracy = len(correct_answers) / len(answers) if answers else 0.0
        response_times = [a.response_time for a in answers if a.response_time and a.response_time > 0]
        avg_response = _mean(response_times) if response_times else 0.0

        style, confidence = self.detect_learning_style(db, user_id, answers)

        current_accuracy = profile.accuracy_rate
        current_rt = profile.avg_response_time
        n = getattr(profile, '_n_samples', 0)

        profile.accuracy_rate = round((current_accuracy * n + accuracy) / (n + 1), 3)
        profile.avg_response_time = round((current_rt * n + avg_response) / (n + 1), 3)
        profile.detected_style = style.value
        profile.style_confidence = confidence
        profile.last_updated = datetime.utcnow()

        if accuracy > 0.8:
            profile.preferred_difficulty = round(min(0.9, profile.preferred_difficulty + 0.03), 3)
        elif accuracy < 0.5:
            profile.preferred_difficulty = round(max(0.2, profile.preferred_difficulty - 0.05), 3)

        profile._n_samples = n + 1
        db.commit()
        db.refresh(profile)
        return profile

    def calculate_spaced_repetition_interval(
        self, difficulty: float, ease_factor: float, repetition_number: int
    ) -> int:
        """
        SM-2 spaced repetition algorithm.
        Returns days until next review.
        """
        if repetition_number == 0:
            return 1
        elif repetition_number == 1:
            return 6

        interval = math.ceil(
            (repetition_number - 1) * ease_factor
        )
        return max(1, interval)

    def generate_study_schedule(
        self, db: Session, user_id: int, course_id: int, target_date: Optional[datetime] = None
    ) -> List[StudySchedule]:
        """
        Generate a personalized study schedule using spaced repetition.
        Balances lesson review with new content based on user's progress and pace.
        """
        if target_date is None:
            target_date = datetime.utcnow()

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return []

        profile = db.query(LearningProfile).filter(LearningProfile.user_id == user_id).first()
        pace_multiplier = {"slow": 1.5, "medium": 1.0, "fast": 0.7}.get(
            user.learning_pace, 1.0
        )

        lessons = db.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.order_index).all()
        quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).all()

        completed_progress = (
            db.query(UserProgress)
            .filter(UserProgress.user_id == user_id, UserProgress.course_id == course_id)
            .all()
        )
        completed_lesson_ids = {p.lesson_id for p in completed_progress if p.lesson_id and p.completed}

        schedule_items = []

        for lesson in lessons:
            if lesson.id in completed_lesson_ids:
                continue

            base_interval = 1
            if profile and profile.accuracy_rate > 0.8:
                base_interval = 3
            elif profile and profile.accuracy_rate < 0.5:
                base_interval = 0

            scheduled_date = target_date + timedelta(days=base_interval * pace_multiplier)
            item = StudySchedule(
                user_id=user_id,
                course_id=course_id,
                content_type=ContentType.LESSON.value,
                content_id=lesson.id,
                recommended_date=scheduled_date,
                scheduled_time_minutes=lesson.duration_minutes,
            )
            schedule_items.append(item)
            db.add(item)
            db.flush()

            quiz = next((q for q in quizzes if q.lesson_id == lesson.id), None)
            if quiz:
                quiz_date = scheduled_date + timedelta(days=1 * pace_multiplier)
                quiz_item = StudySchedule(
                    user_id=user_id,
                    course_id=course_id,
                    content_type=ContentType.QUIZ.value,
                    content_id=quiz.id,
                    recommended_date=quiz_date,
                    scheduled_time_minutes=min(quiz.time_limit_seconds // 60, 30),
                )
                schedule_items.append(quiz_item)
                db.add(quiz_item)
                db.flush()

        for progress in completed_progress:
            if progress.lesson_id and not progress.completed:
                review_interval = 7
                if profile:
                    review_interval = int(7 * (1.5 - profile.preferred_difficulty))
                review_date = target_date + timedelta(days=review_interval)
                item = StudySchedule(
                    user_id=user_id,
                    course_id=course_id,
                    content_type=ContentType.PRACTICE.value,
                    content_id=progress.lesson_id,
                    recommended_date=review_date,
                    scheduled_time_minutes=20,
                )
                schedule_items.append(item)
                db.add(item)
                db.flush()

        db.commit()
        for item in schedule_items:
            db.refresh(item)
        return schedule_items

    def get_recommendations(
        self, db: Session, user_id: int, limit: int = 5
    ) -> List[dict]:
        """
        Generate personalized content recommendations based on weak topics and learning style.
        """
        profile = db.query(LearningProfile).filter(LearningProfile.user_id == user_id).first()
        detected_style = profile.detected_style if profile else LearningStyle.VISUAL.value

        attempts = (
            db.query(QuizAttempt)
            .filter(QuizAttempt.user_id == user_id)
            .order_by(QuizAttempt.started_at.desc())
            .limit(20)
            .all()
        )

        topic_wrong_counts = defaultdict(lambda: {"total": 0, "wrong": 0, "rt": []})

        for attempt in attempts:
            for answer in attempt.answers:
                q = answer.question
                if q and q.topic:
                    topic_wrong_counts[q.topic]["total"] += 1
                    topic_wrong_counts[q.topic]["rt"].append(answer.response_time)
                    if not answer.is_correct:
                        topic_wrong_counts[q.topic]["wrong"] += 1

        weak_topics = []
        for topic, data in topic_wrong_counts.items():
            if data["total"] >= 2:
                error_rate = data["wrong"] / data["total"]
                avg_rt = _mean(data["rt"])
                weak_topics.append({
                    "topic": topic,
                    "error_rate": round(error_rate, 3),
                    "avg_response_time": round(avg_rt, 3),
                })

        weak_topics.sort(key=lambda x: x["error_rate"], reverse=True)

        recommendations = []
        for wt in weak_topics[:limit]:
            recommendations.append({
                "type": "practice",
                "topic": wt["topic"],
                "reason": f"High error rate ({wt['error_rate']:.0%}) detected in {wt['topic']}",
                "learning_style_match": detected_style,
            })

        upcoming_schedules = (
            db.query(StudySchedule)
            .filter(StudySchedule.user_id == user_id, StudySchedule.completed == False)
            .order_by(StudySchedule.recommended_date.asc())
            .limit(limit - len(recommendations))
            .all()
        )

        for sched in upcoming_schedules:
            recommendations.append({
                "type": "schedule",
                "content_id": sched.content_id,
                "content_type": sched.content_type,
                "date": sched.recommended_date.isoformat(),
                "reason": "Scheduled review based on spaced repetition",
                "learning_style_match": detected_style,
            })

        user = db.query(User).filter(User.id == user_id).first()
        if user and not recommendations:
            for lesson in db.query(Lesson).filter(Lesson.course_id == user_id).limit(limit).all():
                recommendations.append({
                    "type": "new_content",
                    "title": lesson.title,
                    "reason": f"New content in {user.learning_pace} pace",
                    "learning_style_match": detected_style,
                })

        return recommendations

    def compute_dashboard_stats(self, db: Session, user_id: int) -> dict:
        """Compute dashboard statistics for the user."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}

        courses = set()
        progress_records = db.query(UserProgress).filter(UserProgress.user_id == user_id).all()
        for p in progress_records:
            courses.add(p.course_id)

        in_progress = sum(1 for p in progress_records if 0 < p.progress_percent < 100)

        attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).all()
        avg_score = None
        if attempts:
            scores = []
            for a in attempts:
                if a.score is not None and a.max_score and a.max_score > 0:
                    scores.append((a.score / a.max_score) * 100)
            if scores:
                avg_score = round(_mean(scores), 1)

        profile = db.query(LearningProfile).filter(LearningProfile.user_id == user_id).first()

        recent_activity = []
        for a in sorted(attempts, key=lambda x: x.started_at, reverse=True)[:5]:
            recent_activity.append({
                "type": "quiz_attempt",
                "score": a.score,
                "max_score": a.max_score,
                "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            })

        next_study = (
            db.query(StudySchedule)
            .filter(StudySchedule.user_id == user_id, StudySchedule.completed == False)
            .order_by(StudySchedule.recommended_date.asc())
            .first()
        )

        streak = self._calculate_streak(db, user_id)

        return {
            "total_courses": len(courses),
            "courses_in_progress": in_progress,
            "avg_quiz_score": avg_score,
            "streak_days": streak,
            "learning_pace": user.learning_pace,
            "detected_style": profile.detected_style if profile else user.preferred_style,
            "style_confidence": profile.style_confidence if profile else 0.3,
            "preferred_difficulty": profile.preferred_difficulty if profile else 0.5,
            "next_study": {
                "content_type": next_study.content_type if next_study else None,
                "content_id": next_study.content_id if next_study else None,
                "recommended_date": next_study.recommended_date.isoformat() if next_study else None,
            },
            "recent_activity": recent_activity,
        }

    def _calculate_streak(self, db: Session, user_id: int) -> int:
        """Calculate the consecutive study days streak."""
        schedules = (
            db.query(StudySchedule)
            .filter(StudySchedule.user_id == user_id, StudySchedule.completed == True)
            .order_by(StudySchedule.recommended_date.desc())
            .all()
        )

        if not schedules:
            return 0

        streak = 0
        current_date = datetime.utcnow().date()
        dates = sorted(set(s.recommended_date.date() for s in schedules), reverse=True)

        for d in dates:
            if d == current_date:
                streak += 1
                current_date = current_date - timedelta(days=1)
            else:
                break

        return streak

    def should_complete_attempt(self, attempt: QuizAttempt) -> bool:
        """Check if a quiz attempt has all questions answered."""
        quiz = attempt.quiz
        answered_count = len(attempt.answers)
        total_count = len(quiz.questions) if quiz else 0
        return answered_count >= total_count and total_count > 0

    def compute_attempt_score(self, attempt: QuizAttempt) -> Tuple[float, float]:
        """Compute score and max score for an attempt based on adaptive weighting."""
        total = 0.0
        max_total = 0.0
        for answer in attempt.answers:
            q = answer.question
            if q:
                max_total += q.difficulty_level * 2
                if answer.is_correct:
                    total += q.difficulty_level * 2

        return round(total, 2), round(max_total, 2)
