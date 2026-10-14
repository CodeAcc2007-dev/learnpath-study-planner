from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Track, Playlist, Video, Unit
from app.schemas import PlaylistCreateRequest, PlaylistResponse
from app.services.youtube import fetch_playlist_metadata
from app.services.planner import cluster_videos_into_units, generate_practice_items
from app.models import PracticeItem

router = APIRouter(prefix="/api/playlists", tags=["playlists"])

@router.post("", response_model=PlaylistResponse, status_code=status.HTTP_201_CREATED)
def add_playlist(req: PlaylistCreateRequest, db: Session = Depends(get_db)):
    track = db.query(Track).filter(Track.id == req.track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    # Fetch YouTube metadata
    try:
        data = fetch_playlist_metadata(req.url_or_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch YouTube playlist: {str(e)}")

    # Create Playlist record
    playlist = Playlist(
        track_id=track.id,
        youtube_playlist_id=data["playlist_id"],
        title=data["title"],
        channel_name=data["channel_name"],
        video_count=data["video_count"]
    )
    db.add(playlist)
    db.commit()
    db.refresh(playlist)

    # Save Video records
    db_videos = []
    for v in data["videos"]:
        video = Video(
            playlist_id=playlist.id,
            youtube_video_id=v["youtube_video_id"],
            title=v["title"],
            description=v["description"],
            duration_s=v["duration_s"],
            position=v["position"],
            transcript=v["transcript"],
            thumbnail_url=v["thumbnail_url"]
        )
        db.add(video)
        db_videos.append(video)

    db.commit()

    # Trigger automatic topic clustering & unit generation for track if no units exist yet
    existing_units = db.query(Unit).filter(Unit.track_id == track.id).all()
    if not existing_units:
        # Collect all videos across playlists for this track
        all_track_videos = []
        for p in track.playlists:
            for vid in p.videos:
                all_track_videos.append({
                    "id": vid.id,
                    "title": vid.title,
                    "description": vid.description,
                    "transcript": vid.transcript
                })

        unit_plans = cluster_videos_into_units(track.name, track.description or "", all_track_videos)
        for idx, u_plan in enumerate(unit_plans):
            unit_status = "available" if idx == 0 else "available"
            unit = Unit(
                track_id=track.id,
                title=u_plan.get("title", f"Unit {idx + 1}"),
                summary=u_plan.get("summary", ""),
                video_ids=u_plan.get("video_ids", []),
                status=unit_status,
                order_index=idx
            )
            db.add(unit)
            db.commit()
            db.refresh(unit)

            # Generate practice items for the unit
            p_items = generate_practice_items(unit.title, unit.summary or "", [v["title"] for v in all_track_videos if v["id"] in unit.video_ids])
            for pi in p_items:
                item = PracticeItem(
                    unit_id=unit.id,
                    kind=pi.get("kind", "external"),
                    title=pi.get("title", "Practice Exercise"),
                    url=pi.get("url", "#"),
                    source_note=pi.get("source_note")
                )
                db.add(item)
            db.commit()

    return playlist

@router.delete("/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_playlist(playlist_id: str, db: Session = Depends(get_db)):
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    db.delete(playlist)
    db.commit()
    return None

@router.put("/videos/{video_id}/toggle")
def toggle_video_completed(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.completed = not video.completed
    db.commit()
    db.refresh(video)

    # Check if unit status should auto-update to 'done'
    playlist = db.query(Playlist).filter(Playlist.id == video.playlist_id).first()
    if playlist:
        units = db.query(Unit).filter(Unit.track_id == playlist.track_id).all()
        for unit in units:
            if video.id in (unit.video_ids or []):
                # Find all videos in this unit
                unit_videos = db.query(Video).filter(Video.id.in_(unit.video_ids)).all()
                if unit_videos and all(v.completed for v in unit_videos):
                    unit.status = "done"
                    db.commit()
                break

    return {"id": video.id, "completed": video.completed}

