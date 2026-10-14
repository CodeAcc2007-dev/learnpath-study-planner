export interface Video {
  id: string;
  playlist_id: string;
  youtube_video_id: string;
  title: string;
  description?: string;
  duration_s: number;
  position: number;
  transcript?: string;
  thumbnail_url?: string;
  completed: boolean;
}

export interface Playlist {
  id: string;
  track_id: string;
  youtube_playlist_id: string;
  title: string;
  channel_name?: string;
  video_count: number;
  added_at: string;
  videos: Video[];
}

export interface PracticeItem {
  id: string;
  unit_id: string;
  kind: "video_native" | "external";
  title: string;
  url: string;
  source_note?: string;
  completed: boolean;
}

export interface Unit {
  id: string;
  track_id: string;
  title: string;
  summary?: string;
  video_ids: string[];
  status: "locked" | "available" | "in_progress" | "done";
  order_index: number;
  practice_items: PracticeItem[];
}

export interface ProjectSuggestion {
  id: string;
  track_id: string;
  unlocked_by_unit_ids: string[];
  title: string;
  description?: string;
  source: "kaggle" | "github" | "other";
  url: string;
  notes?: string;
  status: "locked" | "unlocked" | "completed";
}

export interface StreakLog {
  id: string;
  track_id: string;
  date: string;
  minutes_logged: number;
  completed: boolean;
}

export interface Track {
  id: string;
  name: string;
  description?: string;
  prerequisite_track_ids: string[];
  cadence_days_per_week: number;
  target_minutes_per_day: number;
  created_at: string;
  is_locked: boolean;
  current_streak: number;
  total_minutes: number;
  playlists: Playlist[];
  units: Unit[];
  projects: ProjectSuggestion[];
  streaks: StreakLog[];
}
