import os
import tempfile
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

# Create temp file for test DB before importing app
temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
temp_db_path = temp_db.name
temp_db.close()

os.environ["LEARNPATH_DB_PATH"] = temp_db_path

from app.db import Base, engine, SessionLocal, get_db
import app.models  # Load models
from app.main import app

def override_get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(temp_db_path):
        os.remove(temp_db_path)

def test_health():
    with TestClient(app) as client:
        res = client.get("/api/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

def test_track_crud_and_prerequisites():
    with TestClient(app) as client:
        # Create Track 1 (Prerequisite)
        t1_res = client.post("/api/tracks", json={
            "name": "ML Fundamentals",
            "description": "Core ML math and algorithms",
            "cadence_days_per_week": 5,
            "target_minutes_per_day": 30
        })
        assert t1_res.status_code == 201
        t1_data = t1_res.json()
        t1_id = t1_data["id"]

        # Create Track 2 dependent on Track 1
        t2_res = client.post("/api/tracks", json={
            "name": "Deep Learning Specialization",
            "description": "Neural nets & PyTorch",
            "prerequisite_track_ids": [t1_id],
            "cadence_days_per_week": 4,
            "target_minutes_per_day": 45
        })
        assert t2_res.status_code == 201
        t2_data = t2_res.json()
        
        # Track 2 should be locked since Track 1 has 0 completed units
        assert t2_data["is_locked"] is True

def test_streak_logging():
    with TestClient(app) as client:
        # Create Track
        t_res = client.post("/api/tracks", json={"name": "RAG Architectures"})
        t_id = t_res.json()["id"]

        # Log study time
        log_res = client.post("/api/streaks/log", json={
            "track_id": t_id,
            "date": "2026-08-09",
            "minutes_logged": 35
        })
        assert log_res.status_code == 200
        assert log_res.json()["completed"] is True

def test_playlist_import_and_unit_generation():
    mock_playlist_data = {
        "playlist_id": "PL1234567890",
        "title": "Intro to Agentic AI",
        "channel_name": "AI Academy",
        "video_count": 2,
        "videos": [
            {
                "youtube_video_id": "vid1",
                "title": "Module 1: What are LLM Agents?",
                "description": "Introduction to tool use and decision loops",
                "duration_s": 600,
                "position": 0,
                "thumbnail_url": "https://img.youtube.com/vi/vid1/0.jpg",
                "transcript": "In this video we explore agent architectures."
            },
            {
                "youtube_video_id": "vid2",
                "title": "Module 2: ReAct Pattern in Action",
                "description": "Reasoning and acting loops with Python",
                "duration_s": 900,
                "position": 1,
                "thumbnail_url": "https://img.youtube.com/vi/vid2/0.jpg",
                "transcript": "Here we build a ReAct agent using custom functions."
            }
        ]
    }

    with patch("app.routers.playlists.fetch_playlist_metadata", return_value=mock_playlist_data):
        with TestClient(app) as client:
            # 1. Create track
            t_res = client.post("/api/tracks", json={"name": "Agentic AI Engineering"})
            t_id = t_res.json()["id"]

            # 2. Add playlist
            pl_res = client.post("/api/playlists", json={
                "track_id": t_id,
                "url_or_id": "https://youtube.com/playlist?list=PL1234567890"
            })
            assert pl_res.status_code == 201
            pl_data = pl_res.json()
            assert pl_data["youtube_playlist_id"] == "PL1234567890"

            # 3. Check track details for auto-generated units
            track_res = client.get(f"/api/tracks/{t_id}")
            assert track_res.status_code == 200
            track_data = track_res.json()
            assert len(track_data["units"]) > 0
            
            unit_id = track_data["units"][0]["id"]
            
            # 4. Add practice item
            p_res = client.post(f"/api/units/{unit_id}/practice", json={
                "title": "Build a simple ReAct loop in Python",
                "url": "https://github.com/example/react-agent"
            })
            assert p_res.status_code == 201
            item_id = p_res.json()["id"]

            # 5. Toggle practice item
            toggle_res = client.put(f"/api/units/{unit_id}/practice/{item_id}/toggle")
            assert toggle_res.status_code == 200
            assert toggle_res.json()["completed"] is True

            # 6. Update unit status to done
            u_update = client.put(f"/api/units/{unit_id}", json={"status": "done"})
            assert u_update.status_code == 200
            assert u_update.json()["status"] == "done"

            # 7. Generate portfolio project suggestions
            proj_res = client.post(f"/api/planner/suggest-projects/{t_id}")
            assert proj_res.status_code == 200
