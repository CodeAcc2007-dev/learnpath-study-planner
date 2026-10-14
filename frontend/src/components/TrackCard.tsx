import {
  ArrowUpRight,
  Clock,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Track } from "../types";
import { CourseArtwork } from "./CourseArtwork";
import { courseStats, formatMinutes } from "../lib/learning";
interface Props {
  track: Track;
  allTracks: Track[];
  onSelect: (t: Track) => void;
  onLogTime: (t: Track) => void;
  onEdit: (t: Track) => void;
  onDelete: (id: string) => void;
}
export function TrackCard({
  track,
  allTracks,
  onSelect,
  onLogTime,
  onEdit,
  onDelete,
}: Props) {
  const { total, completed, percent, duration } = courseStats(track);
  const prerequisites = allTracks.filter((t) =>
    track.prerequisite_track_ids.includes(t.id),
  );
  return (
    <article className="course-card">
      <button
        className="course-cover"
        onClick={() => onSelect(track)}
        aria-label={`Open ${track.name}`}
      >
        <CourseArtwork name={track.name} />
      </button>
      <div className="course-card-body">
        <div className="card-overline">
          <span
            className={`status ${track.is_locked ? "muted" : completed ? "green" : ""}`}
          >
            {track.is_locked ? (
              <>
                <Lock /> Prerequisite required
              </>
            ) : total && completed === total ? (
              "Completed"
            ) : completed ? (
              "In progress"
            ) : (
              "Not started"
            )}
          </span>
          <details className="course-menu">
            <summary aria-label={`Options for ${track.name}`}>
              <MoreHorizontal />
            </summary>
            <div className="menu-panel">
              <button onClick={() => onEdit(track)}>
                <Pencil /> Edit course
              </button>
              <button onClick={() => onLogTime(track)}>
                <Clock /> Log study time
              </button>
              <button
                className="danger-text"
                onClick={() => {
                  if (
                    confirm(
                      `Delete “${track.name}” and all its lessons and progress? This cannot be undone.`,
                    )
                  )
                    onDelete(track.id);
                }}
              >
                <Trash2 /> Delete course
              </button>
            </div>
          </details>
        </div>
        <h3>
          <button onClick={() => onSelect(track)}>{track.name}</button>
        </h3>
        <p className="course-description">
          {track.description || "Your next subject starts here."}
        </p>
        <div className="course-meta">
          <span>{track.units.length} sections</span>
          <span>{total} lessons</span>
          <span>{formatMinutes(Math.round(duration / 60))}</span>
        </div>
        {track.is_locked && (
          <p className="prerequisite-note">
            Complete{" "}
            {prerequisites.map((t) => t.name).join(", ") ||
              "the prerequisite courses"}{" "}
            first.
          </p>
        )}
        <div className="card-progress">
          <span>
            {completed} of {total} lessons
          </span>
          <strong>{percent}%</strong>
          <progress
            value={completed}
            max={total || 1}
            aria-label={`${track.name} progress`}
          />
        </div>
        <button className="course-cta" onClick={() => onSelect(track)}>
          {track.is_locked
            ? "View course"
            : !total
              ? "Add your first playlist"
              : completed === total
                ? "Review course"
                : completed
                  ? "Continue learning"
                  : "Start learning"}
          <ArrowUpRight />
        </button>
      </div>
    </article>
  );
}
