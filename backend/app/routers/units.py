from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Unit, Track, PracticeItem, ProjectSuggestion
from app.schemas import UnitCreate, UnitUpdate, UnitResponse, PracticeItemCreate, PracticeItemResponse
from app.services.planner import suggest_projects_for_completed_units

router = APIRouter(prefix="/api/units", tags=["units"])

@router.get("/track/{track_id}", response_model=List[UnitResponse])
def get_units_by_track(track_id: str, db: Session = Depends(get_db)):
    return db.query(Unit).filter(Unit.track_id == track_id).order_by(Unit.order_index).all()

@router.put("/{unit_id}", response_model=UnitResponse)
def update_unit(unit_id: str, unit_in: UnitUpdate, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    old_status = unit.status
    if unit_in.title is not None:
        unit.title = unit_in.title
    if unit_in.summary is not None:
        unit.summary = unit_in.summary
    if unit_in.video_ids is not None:
        unit.video_ids = unit_in.video_ids
    if unit_in.status is not None:
        unit.status = unit_in.status
    if unit_in.order_index is not None:
        unit.order_index = unit_in.order_index

    db.commit()
    db.refresh(unit)

    # State transition triggers when marked done
    if old_status != "done" and unit.status == "done":
        track = db.query(Track).filter(Track.id == unit.track_id).first()
        if track:
            # Unlock next sequential unit
            next_unit = db.query(Unit).filter(
                Unit.track_id == track.id,
                Unit.order_index > unit.order_index
            ).order_by(Unit.order_index).first()
            if next_unit and next_unit.status in ["locked", "available"]:
                next_unit.status = "in_progress"
                db.commit()

            # Check if all units or major cluster completed -> propose projects
            completed_units = [u for u in track.units if u.status == "done"]
            if len(completed_units) > 0 and (len(completed_units) == len(track.units) or len(completed_units) % 2 == 0):
                completed_titles = [u.title for u in completed_units]
                proj_suggestions = suggest_projects_for_completed_units(track.name, completed_titles)
                for ps in proj_suggestions:
                    # Avoid exact title duplicates
                    existing = db.query(ProjectSuggestion).filter(
                        ProjectSuggestion.track_id == track.id,
                        ProjectSuggestion.title == ps.get("title")
                    ).first()
                    if not existing:
                        proj = ProjectSuggestion(
                            track_id=track.id,
                            unlocked_by_unit_ids=[u.id for u in completed_units],
                            title=ps.get("title", "Portfolio Project"),
                            description=ps.get("description", ""),
                            source=ps.get("source", "github"),
                            url=ps.get("url", "#"),
                            notes=ps.get("notes", ""),
                            status="unlocked"
                        )
                        db.add(proj)
                db.commit()

    return unit

@router.post("/{unit_id}/practice", response_model=PracticeItemResponse, status_code=status.HTTP_201_CREATED)
def add_practice_item(unit_id: str, item_in: PracticeItemCreate, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    item = PracticeItem(
        unit_id=unit.id,
        kind=item_in.kind,
        title=item_in.title,
        url=item_in.url,
        source_note=item_in.source_note,
        completed=item_in.completed
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{unit_id}/practice/{item_id}/toggle", response_model=PracticeItemResponse)
def toggle_practice_item(unit_id: str, item_id: str, db: Session = Depends(get_db)):
    item = db.query(PracticeItem).filter(PracticeItem.id == item_id, PracticeItem.unit_id == unit_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Practice item not found")

    item.completed = not item.completed
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(unit_id: str, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    db.delete(unit)
    db.commit()
    return None
