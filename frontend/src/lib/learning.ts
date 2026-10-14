import type { Track } from "../types";
export function courseStats(track: Track) {
  const videos = track.playlists.flatMap((p) => p.videos);
  const completed = videos.filter((v) => v.completed).length;
  return {
    videos,
    completed,
    total: videos.length,
    percent: videos.length ? Math.round((completed / videos.length) * 100) : 0,
    duration: videos.reduce((n, v) => n + v.duration_s, 0),
  };
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function formatMinutes(minutes: number) {
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`
    : `${minutes}m`;
}
export function getBookmark(track: Track) {
  try {
    const id = localStorage.getItem(`learnpath:lesson:${track.id}`);
    return courseStats(track).videos.find((v) => v.id === id);
  } catch {
    return undefined;
  }
}
export function nextLesson(track: Track) {
  const { videos } = courseStats(track);
  return getBookmark(track) || videos.find((v) => !v.completed) || videos[0];
}
export function saveBookmark(trackId: string, videoId: string) {
  try {
    localStorage.setItem(`learnpath:lesson:${trackId}`, videoId);
    localStorage.setItem("learnpath:last-course", trackId);
  } catch {
    /* Progress remains stored on the server when local storage is unavailable. */
  }
}
export function lastCourseId() {
  try {
    return localStorage.getItem("learnpath:last-course");
  } catch {
    return null;
  }
}
export function courseTheme(name: string) {
  return /deep|neural/i.test(name)
    ? "clay"
    : /product|design|business/i.test(name)
      ? "sand"
      : "sage";
}
