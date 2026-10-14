from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Track, Unit, Video, PracticeItem, ProjectSuggestion
from app.services.planner import cluster_videos_into_units, generate_practice_items, suggest_projects_for_completed_units

router = APIRouter(prefix="/api/planner", tags=["planner"])

@router.post("/recluster/{track_id}")
def recluster_track(track_id: str, db: Session = Depends(get_db)):
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    # Gather all videos across track playlists
    all_videos = []
    for playlist in track.playlists:
        for v in playlist.videos:
            all_videos.append({
                "id": v.id,
                "title": v.title,
                "description": v.description,
                "transcript": v.transcript
            })

    if not all_videos:
        raise HTTPException(status_code=400, detail="No videos found in track playlists to cluster.")

    # Remove existing units & practice items for clean recluster
    for u in track.units:
        db.delete(u)
    db.commit()

    unit_plans = cluster_videos_into_units(track.name, track.description or "", all_videos)
    created_units = []

    for idx, u_plan in enumerate(unit_plans):
        unit = Unit(
            track_id=track.id,
            title=u_plan.get("title", f"Unit {idx + 1}"),
            summary=u_plan.get("summary", ""),
            video_ids=u_plan.get("video_ids", []),
            status="available" if idx == 0 else "available",
            order_index=idx
        )
        db.add(unit)
        db.commit()
        db.refresh(unit)

        # Generate practice items
        assigned_titles = [v["title"] for v in all_videos if v["id"] in unit.video_ids]
        p_items = generate_practice_items(unit.title, unit.summary or "", assigned_titles)
        for pi in p_items:
            item = PracticeItem(
                unit_id=unit.id,
                kind=pi.get("kind", "external"),
                title=pi.get("title", "Practice Task"),
                url=pi.get("url", "#"),
                source_note=pi.get("source_note")
            )
            db.add(item)
        db.commit()
        created_units.append(unit)

    return {"message": f"Successfully re-clustered track into {len(created_units)} units."}

@router.post("/suggest-projects/{track_id}")
def generate_track_projects(track_id: str, db: Session = Depends(get_db)):
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    unit_titles = [u.title for u in track.units if u.status == "done"] or [u.title for u in track.units[:2]]
    suggestions = suggest_projects_for_completed_units(track.name, unit_titles)

    created_projects = []
    for ps in suggestions:
        proj = ProjectSuggestion(
            track_id=track.id,
            unlocked_by_unit_ids=[u.id for u in track.units if u.status == "done"],
            title=ps.get("title", "Portfolio Project"),
            description=ps.get("description", ""),
            source=ps.get("source", "github"),
            url=ps.get("url", "#"),
            notes=ps.get("notes", ""),
            status="unlocked"
        )
        db.add(proj)
        db.commit()
        db.refresh(proj)
        created_projects.append(proj.id)

    return {"message": f"Generated {len(created_projects)} project suggestions."}
