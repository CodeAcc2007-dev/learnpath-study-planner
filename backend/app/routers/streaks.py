from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import StreakLog, Track
from app.schemas import StreakLogCreate, StreakLogResponse

router = APIRouter(prefix="/api/streaks", tags=["streaks"])

@router.post("/log", response_model=StreakLogResponse)
def log_study_time(req: StreakLogCreate, db: Session = Depends(get_db)):
    track = db.query(Track).filter(Track.id == req.track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    target_date = req.date or date.today().isoformat()
    streak = db.query(StreakLog).filter(
        StreakLog.track_id == track.id,
        StreakLog.date == target_date
    ).first()

    if not streak:
        streak = StreakLog(
            track_id=track.id,
            date=target_date,
            minutes_logged=req.minutes_logged,
            completed=(req.minutes_logged >= track.target_minutes_per_day)
        )
        db.add(streak)
    else:
        streak.minutes_logged += req.minutes_logged
        if streak.minutes_logged >= track.target_minutes_per_day:
            streak.completed = True

    db.commit()
    db.refresh(streak)
    return streak

@router.get("/track/{track_id}", response_model=List[StreakLogResponse])
def get_track_streaks(track_id: str, db: Session = Depends(get_db)):
    return db.query(StreakLog).filter(StreakLog.track_id == track_id).order_by(StreakLog.date.desc()).all()
