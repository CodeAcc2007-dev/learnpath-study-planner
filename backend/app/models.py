import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db import Base

def generate_uuid():
    return str(uuid.uuid4())

class Track(Base):
    __tablename__ = "tracks"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    prerequisite_track_ids = Column(JSON, default=list)  # list of track IDs
    cadence_days_per_week = Column(Integer, default=5)
    target_minutes_per_day = Column(Integer, default=30)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    playlists = relationship("Playlist", back_populates="track", cascade="all, delete-orphan")
    units = relationship("Unit", back_populates="track", cascade="all, delete-orphan", order_by="Unit.order_index")
    projects = relationship("ProjectSuggestion", back_populates="track", cascade="all, delete-orphan")
    streaks = relationship("StreakLog", back_populates="track", cascade="all, delete-orphan")

class Playlist(Base):
    __tablename__ = "playlists"

    id = Column(String, primary_key=True, default=generate_uuid)
    track_id = Column(String, ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False)
    youtube_playlist_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    channel_name = Column(String, nullable=True)
    video_count = Column(Integer, default=0)
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    track = relationship("Track", back_populates="playlists")
    videos = relationship("Video", back_populates="playlist", cascade="all, delete-orphan", order_by="Video.position")

class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=generate_uuid)
    playlist_id = Column(String, ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False)
    youtube_video_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    duration_s = Column(Integer, default=0)
    position = Column(Integer, default=0)
    transcript = Column(Text, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    completed = Column(Boolean, default=False)

    playlist = relationship("Playlist", back_populates="videos")

class Unit(Base):
    __tablename__ = "units"

    id = Column(String, primary_key=True, default=generate_uuid)
    track_id = Column(String, ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    video_ids = Column(JSON, default=list)  # list of video table UUIDs
    status = Column(String, default="available")  # locked | available | in_progress | done
    order_index = Column(Integer, default=0)

    track = relationship("Track", back_populates="units")
    practice_items = relationship("PracticeItem", back_populates="unit", cascade="all, delete-orphan")

class PracticeItem(Base):
    __tablename__ = "practice_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    unit_id = Column(String, ForeignKey("units.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String, default="external")  # video_native | external
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    source_note = Column(String, nullable=True)
    completed = Column(Boolean, default=False)

    unit = relationship("Unit", back_populates="practice_items")

class ProjectSuggestion(Base):
    __tablename__ = "project_suggestions"

    id = Column(String, primary_key=True, default=generate_uuid)
    track_id = Column(String, ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False)
    unlocked_by_unit_ids = Column(JSON, default=list)  # unit UUIDs required
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    source = Column(String, default="github")  # kaggle | github | other
    url = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String, default="locked")  # locked | unlocked | completed

    track = relationship("Track", back_populates="projects")

class StreakLog(Base):
    __tablename__ = "streak_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    track_id = Column(String, ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False)
    date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    minutes_logged = Column(Integer, default=0)
    completed = Column(Boolean, default=False)

    track = relationship("Track", back_populates="streaks")
