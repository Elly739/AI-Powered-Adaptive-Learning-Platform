from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, StudySchedule, Course
from schemas import ScheduleItemResponse, DashboardStats
from auth import get_current_user
from adaptive_engine import AdaptiveEngine

router = APIRouter(prefix="/schedule", tags=["schedule"])
engine = AdaptiveEngine()

@router.get("/", response_model=List[ScheduleItemResponse])
def list_schedule(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(StudySchedule)
        .filter(StudySchedule.user_id == user.id)
        .order_by(StudySchedule.recommended_date.asc())
        .all()
    )

@router.post("/generate/{course_id}")
def generate_schedule(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = db.query(StudySchedule).filter(
        StudySchedule.user_id == user.id,
        StudySchedule.course_id == course_id,
    ).all()
    for item in existing:
        db.delete(item)
    db.commit()

    items = engine.generate_study_schedule(db, user.id, course_id)
    return {"message": f"Generated {len(items)} schedule items", "items": [i.id for i in items]}

@router.put("/{item_id}/complete")
def mark_schedule_complete(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(StudySchedule).filter(
        StudySchedule.id == item_id, StudySchedule.user_id == user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Schedule item not found")
    item.completed = True
    db.commit()
    db.refresh(item)
    return {"message": "Schedule item marked complete", "item_id": item.id}

@router.put("/{item_id}/skip")
def skip_schedule_item(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(StudySchedule).filter(
        StudySchedule.id == item_id, StudySchedule.user_id == user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Schedule item not found")
    item.completed = True
    item.recommended_date = item.recommended_date.replace(year=item.recommended_date.year + 1) if item.recommended_date else item.recommended_date
    db.commit()
    return {"message": "Schedule item skipped", "item_id": item.id}

@router.get("/recommendations")
def get_recommendations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return engine.get_recommendations(db, user.id)
