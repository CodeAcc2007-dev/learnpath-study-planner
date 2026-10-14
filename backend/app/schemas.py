from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

# --- Track Schemas ---
class TrackBase(BaseModel):
    name: str
    description: Optional[str] = None
    prerequisite_track_ids: List[str] = []
    cadence_days_per_week: int = 5
    target_minutes_per_day: int = 30

class TrackCreate(TrackBase):
    pass

class TrackUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    prerequisite_track_ids: Optional[List[str]] = None
    cadence_days_per_week: Optional[int] = None
    target_minutes_per_day: Optional[int] = None

# --- Playlist & Video Schemas ---
class VideoBase(BaseModel):
    youtube_video_id: str
    title: str
    description: Optional[str] = None
    duration_s: int = 0
    position: int = 0
    transcript: Optional[str] = None
    thumbnail_url: Optional[str] = None
    completed: bool = False

class VideoResponse(VideoBase):
    id: str
    playlist_id: str
    model_config = ConfigDict(from_attributes=True)

class PlaylistCreateRequest(BaseModel):
    track_id: str
    url_or_id: str

class PlaylistResponse(BaseModel):
    id: str
    track_id: str
    youtube_playlist_id: str
    title: str
    channel_name: Optional[str] = None
    video_count: int
    added_at: datetime
    videos: List[VideoResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- Practice Item Schemas ---
class PracticeItemBase(BaseModel):
    kind: str = "external"
    title: str
    url: str
    source_note: Optional[str] = None
    completed: bool = False

class PracticeItemCreate(PracticeItemBase):
    pass

class PracticeItemResponse(PracticeItemBase):
    id: str
    unit_id: str
    model_config = ConfigDict(from_attributes=True)

# --- Unit Schemas ---
class UnitBase(BaseModel):
    title: str
    summary: Optional[str] = None
    video_ids: List[str] = []
    status: str = "available"  # locked | available | in_progress | done
    order_index: int = 0

class UnitCreate(UnitBase):
    track_id: str

class UnitUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    video_ids: Optional[List[str]] = None
    status: Optional[str] = None
    order_index: Optional[int] = None

class UnitResponse(UnitBase):
    id: str
    track_id: str
    practice_items: List[PracticeItemResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- Project Suggestion Schemas ---
class ProjectSuggestionBase(BaseModel):
    unlocked_by_unit_ids: List[str] = []
    title: str
    description: Optional[str] = None
    source: str = "github"
    url: str
    notes: Optional[str] = None
    status: str = "locked"  # locked | unlocked | completed

class ProjectSuggestionCreate(ProjectSuggestionBase):
    track_id: str

class ProjectSuggestionResponse(ProjectSuggestionBase):
    id: str
    track_id: str
    model_config = ConfigDict(from_attributes=True)

# --- Streak Log Schemas ---
class StreakLogBase(BaseModel):
    date: str
    minutes_logged: int = 0
    completed: bool = False

class StreakLogCreate(StreakLogBase):
    track_id: str

class StreakLogResponse(StreakLogBase):
    id: str
    track_id: str
    model_config = ConfigDict(from_attributes=True)

# --- Complete Track Detail Response ---
class TrackResponse(TrackBase):
    id: str
    created_at: datetime
    is_locked: bool = False
    playlists: List[PlaylistResponse] = []
    units: List[UnitResponse] = []
    projects: List[ProjectSuggestionResponse] = []
    streaks: List[StreakLogResponse] = []
    current_streak: int = 0
    total_minutes: int = 0
    model_config = ConfigDict(from_attributes=True)
