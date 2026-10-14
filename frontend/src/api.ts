import type { Track, Playlist, Unit, PracticeItem, StreakLog } from "./types";

const API_BASE = "/api";

export async function fetchTracks(): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/tracks`);
  if (!res.ok) throw new Error("Failed to fetch tracks");
  return res.json();
}

export async function fetchTrack(id: string): Promise<Track> {
  const res = await fetch(`${API_BASE}/tracks/${id}`);
  if (!res.ok) throw new Error("Failed to fetch track");
  return res.json();
}

export async function createTrack(trackData: {
  name: string;
  description?: string;
  prerequisite_track_ids?: string[];
  cadence_days_per_week?: number;
  target_minutes_per_day?: number;
}): Promise<Track> {
  const res = await fetch(`${API_BASE}/tracks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trackData),
  });
  if (!res.ok) throw new Error("Failed to create track");
  return res.json();
}

export async function updateTrack(
  id: string,
  trackData: Partial<{
    name: string;
    description: string;
    prerequisite_track_ids: string[];
    cadence_days_per_week: number;
    target_minutes_per_day: number;
  }>,
): Promise<Track> {
  const res = await fetch(`${API_BASE}/tracks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trackData),
  });
  if (!res.ok) throw new Error("Failed to update track");
  return res.json();
}

export async function deleteTrack(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tracks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete track");
}

export async function addPlaylist(
  trackId: string,
  urlOrId: string,
): Promise<Playlist> {
  const res = await fetch(`${API_BASE}/playlists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ track_id: trackId, url_or_id: urlOrId }),
  });
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ detail: "Failed to add playlist" }));
    throw new Error(errorData.detail || "Failed to add playlist");
  }
  return res.json();
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/playlists/${playlistId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete playlist");
}

export async function toggleVideoCompleted(
  videoId: string,
): Promise<{ id: string; completed: boolean }> {
  const res = await fetch(`${API_BASE}/playlists/videos/${videoId}/toggle`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Failed to toggle video completion");
  return res.json();
}

export async function updateUnitStatus(
  unitId: string,
  status: string,
): Promise<Unit> {
  const res = await fetch(`${API_BASE}/units/${unitId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update unit status");
  return res.json();
}

export async function addPracticeItem(
  unitId: string,
  item: { title: string; url: string; source_note?: string; kind?: string },
): Promise<PracticeItem> {
  const res = await fetch(`${API_BASE}/units/${unitId}/practice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Failed to add practice item");
  return res.json();
}

export async function togglePracticeItem(
  unitId: string,
  itemId: string,
): Promise<PracticeItem> {
  const res = await fetch(
    `${API_BASE}/units/${unitId}/practice/${itemId}/toggle`,
    {
      method: "PUT",
    },
  );
  if (!res.ok) throw new Error("Failed to toggle practice item");
  return res.json();
}

export async function logStreak(
  trackId: string,
  minutesLogged: number,
  dateStr?: string,
): Promise<StreakLog> {
  const res = await fetch(`${API_BASE}/streaks/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      track_id: trackId,
      minutes_logged: minutesLogged,
      date: dateStr || new Date().toISOString().split("T")[0],
    }),
  });
  if (!res.ok) throw new Error("Failed to log streak study time");
  return res.json();
}

export async function reclusterTrack(
  trackId: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/planner/recluster/${trackId}`, {
    method: "POST",
  });
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ detail: "Failed to re-cluster track" }));
    throw new Error(errorData.detail || "Failed to re-cluster track");
  }
  return res.json();
}

export async function suggestProjects(
  trackId: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/planner/suggest-projects/${trackId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to generate project suggestions");
  return res.json();
}
