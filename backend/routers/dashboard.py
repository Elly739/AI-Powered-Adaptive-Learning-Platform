from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth import get_current_user
from adaptive_engine import AdaptiveEngine
from schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
engine = AdaptiveEngine()

@router.get("/stats")
def get_dashboard_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return engine.compute_dashboard_stats(db, user.id)

@router.get("/profile")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import LearningProfile
    profile = db.query(LearningProfile).filter(LearningProfile.user_id == user.id).first()
    if not profile:
        return {
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "learning_pace": user.learning_pace,
            "preferred_style": user.preferred_style,
            "detected_style": None,
            "style_confidence": 0.0,
            "avg_response_time": 0.0,
            "accuracy_rate": 0.0,
            "preferred_difficulty": 0.5,
        }
    return {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "learning_pace": user.learning_pace,
        "preferred_style": user.preferred_style,
        "detected_style": profile.detected_style,
        "style_confidence": profile.style_confidence,
        "avg_response_time": profile.avg_response_time,
        "accuracy_rate": profile.accuracy_rate,
        "preferred_difficulty": profile.preferred_difficulty,
    }
