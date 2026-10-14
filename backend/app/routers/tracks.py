from typing import List
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Track, Unit, StreakLog, Playlist, Video, ProjectSuggestion, PracticeItem
from app.schemas import TrackCreate, TrackUpdate, TrackResponse, UnitResponse, PlaylistResponse, ProjectSuggestionResponse, StreakLogResponse, VideoResponse, PracticeItemResponse

router = APIRouter(prefix="/api/tracks", tags=["tracks"])

def calculate_track_status(track: Track, db: Session) -> dict:
    """Helper to calculate prerequisite locked status, streak, and total study minutes."""
    # Check if locked by prerequisite tracks
    is_locked = False
    if track.prerequisite_track_ids:
        for prereq_id in track.prerequisite_track_ids:
            prereq_track = db.query(Track).filter(Track.id == prereq_id).first()
            if not prereq_track:
                continue
            # If prereq track has no units or has non-done units, current track remains locked
            total_prereq_units = len(prereq_track.units)
            done_prereq_units = sum(1 for u in prereq_track.units if u.status == "done")
            if total_prereq_units == 0 or done_prereq_units < total_prereq_units:
                is_locked = True
                break

    # Calculate streak (consecutive completed days ending today or yesterday)
    streaks = db.query(StreakLog).filter(StreakLog.track_id == track.id).order_by(StreakLog.date.desc()).all()
    streak_map = {s.date: s for s in streaks}
    
    current_streak = 0
    today = date.today()
    check_date = today
    
    # Check today first; if today is not logged/completed, start check from yesterday
    if today.isoformat() in streak_map and (streak_map[today.isoformat()].completed or streak_map[today.isoformat()].minutes_logged >= track.target_minutes_per_day):
        pass
    else:
        check_date = today - timedelta(days=1)

    while check_date.isoformat() in streak_map:
        log = streak_map[check_date.isoformat()]
        if log.completed or log.minutes_logged >= track.target_minutes_per_day:
            current_streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    total_minutes = sum(s.minutes_logged for s in streaks)

    return {
        "is_locked": is_locked,
        "current_streak": current_streak,
        "total_minutes": total_minutes
    }

def format_track_response(track: Track, db: Session) -> dict:
    stats = calculate_track_status(track, db)
    
    formatted_playlists = []
    for p in track.playlists:
        formatted_videos = [VideoResponse.model_validate(v) for v in p.videos]
        formatted_playlists.append({
            "id": p.id,
            "track_id": p.track_id,
            "youtube_playlist_id": p.youtube_playlist_id,
            "title": p.title,
            "channel_name": p.channel_name,
            "video_count": p.video_count,
            "added_at": p.added_at,
            "videos": formatted_videos
        })

    formatted_units = []
    for u in track.units:
        formatted_practice = [PracticeItemResponse.model_validate(pi) for pi in u.practice_items]
        # If parent track is locked, mark unit locked
        unit_status = "locked" if stats["is_locked"] else u.status
        formatted_units.append({
            "id": u.id,
            "track_id": u.track_id,
            "title": u.title,
            "summary": u.summary,
            "video_ids": u.video_ids or [],
            "status": unit_status,
            "order_index": u.order_index,
            "practice_items": formatted_practice
        })

    formatted_projects = [ProjectSuggestionResponse.model_validate(proj) for proj in track.projects]
    formatted_streaks = [StreakLogResponse.model_validate(s) for s in track.streaks]

    return {
        "id": track.id,
        "name": track.name,
        "description": track.description,
        "prerequisite_track_ids": track.prerequisite_track_ids or [],
        "cadence_days_per_week": track.cadence_days_per_week,
        "target_minutes_per_day": track.target_minutes_per_day,
        "created_at": track.created_at,
        "is_locked": stats["is_locked"],
        "current_streak": stats["current_streak"],
        "total_minutes": stats["total_minutes"],
        "playlists": formatted_playlists,
        "units": formatted_units,
        "projects": formatted_projects,
        "streaks": formatted_streaks
    }

@router.get("", response_model=List[TrackResponse])
def list_tracks(db: Session = Depends(get_db)):
    tracks = db.query(Track).all()
    return [format_track_response(t, db) for t in tracks]

@router.post("", response_model=TrackResponse, status_code=status.HTTP_201_CREATED)
def create_track(track_in: TrackCreate, db: Session = Depends(get_db)):
    track = Track(
        name=track_in.name,
        description=track_in.description,
        prerequisite_track_ids=track_in.prerequisite_track_ids,
        cadence_days_per_week=track_in.cadence_days_per_week,
        target_minutes_per_day=track_in.target_minutes_per_day
    )
    db.add(track)
    db.commit()
    db.refresh(track)
    return format_track_response(track, db)

@router.get("/{track_id}", response_model=TrackResponse)
def get_track(track_id: str, db: Session = Depends(get_db)):
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    return format_track_response(track, db)

@router.put("/{track_id}", response_model=TrackResponse)
def update_track(track_id: str, track_in: TrackUpdate, db: Session = Depends(get_db)):
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    if track_in.name is not None:
        track.name = track_in.name
    if track_in.description is not None:
        track.description = track_in.description
    if track_in.prerequisite_track_ids is not None:
        track.prerequisite_track_ids = track_in.prerequisite_track_ids
    if track_in.cadence_days_per_week is not None:
        track.cadence_days_per_week = track_in.cadence_days_per_week
    if track_in.target_minutes_per_day is not None:
        track.target_minutes_per_day = track_in.target_minutes_per_day

    db.commit()
    db.refresh(track)
    return format_track_response(track, db)

@router.delete("/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_track(track_id: str, db: Session = Depends(get_db)):
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    db.delete(track)
    db.commit()
    return None
