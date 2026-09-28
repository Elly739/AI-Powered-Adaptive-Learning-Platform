from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
from models import UserProgress, Lesson, User, StudySchedule
from schemas import UserProgressResponse, ScheduleItemResponse
from auth import get_current_user
from adaptive_engine import AdaptiveEngine

router = APIRouter(prefix="/progress", tags=["progress"])
engine = AdaptiveEngine()

@router.get("/", response_model=List[UserProgressResponse])
def list_progress(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(UserProgress).filter(UserProgress.user_id == user.id).all()

@router.post("/{lesson_id}/complete")
def mark_complete(lesson_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user.id, UserProgress.lesson_id == lesson_id
    ).first()
    if not progress:
        progress = UserProgress(
            user_id=user.id,
            course_id=lesson.course_id,
            lesson_id=lesson_id,
            completed=True,
            progress_percent=100.0,
            updated_at=datetime.utcnow(),
        )
        db.add(progress)
    else:
        progress.completed = True
        progress.progress_percent = 100.0
        progress.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(progress)

    schedule_item = (
        db.query(StudySchedule)
        .filter(
            StudySchedule.user_id == user.id,
            StudySchedule.content_type == "lesson",
            StudySchedule.content_id == lesson_id,
            StudySchedule.completed == False,
        )
        .first()
    )
    if schedule_item:
        schedule_item.completed = True
        db.commit()

    return {"message": "Lesson marked as complete", "progress_id": progress.id}

@router.put("/{lesson_id}")
def update_progress(lesson_id: int, percent: float, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user.id, UserProgress.lesson_id == lesson_id
    ).first()
    if not progress:
        progress = UserProgress(
            user_id=user.id,
            course_id=lesson.course_id,
            lesson_id=lesson_id,
            progress_percent=percent,
            updated_at=datetime.utcnow(),
        )
        db.add(progress)
    else:
        progress.progress_percent = percent
        progress.completed = percent >= 100.0
        progress.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(progress)
    return {"message": "Progress updated", "progress_percent": progress.progress_percent}
