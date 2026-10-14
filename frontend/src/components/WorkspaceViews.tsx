import {
  BookOpen,
  CheckCircle2,
  Circle,
  ExternalLink,
  Clock,
  FolderGit2,
  Plus,
  Flame,
} from "lucide-react";
import type { Track } from "../types";
import { StudyWeek } from "./LearningDashboard";
import { formatMinutes } from "../lib/learning";
export function WorkspaceViews({
  view,
  tracks,
  onSelect,
  onLogTime,
  onTogglePractice,
}: {
  view: string;
  tracks: Track[];
  onSelect: (t: Track) => void;
  onLogTime: (t: Track) => void;
  onTogglePractice: (unitId: string, itemId: string) => Promise<void>;
}) {
  const titles: Record<string, [string, string]> = {
    practice: ["Practice", "Put what you’re learning into practice."],
    projects: ["Projects", "Turn your coursework into something you can show."],
    activity: ["Study activity", "A record of the time you make for learning."],
  };
  const [title, description] = titles[view] || titles.activity;
  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      {view === "activity" ? (
        <>
          <div className="activity-summary">
            <section className="panel activity-total">
              <Clock />
              <strong>
                {formatMinutes(tracks.reduce((n, t) => n + t.total_minutes, 0))}
              </strong>
              <span>Total study time</span>
            </section>
            <section className="panel activity-total">
              <Flame />
              <strong>
                {Math.max(0, ...tracks.map((t) => t.current_streak))} days
              </strong>
              <span>Longest current course streak</span>
            </section>
            <StudyWeek tracks={tracks} />
          </div>
          <section className="panel">
            <h2>Your study plan</h2>
            {tracks.map((t) => (
              <div className="resource-row" key={t.id}>
                <div>
                  <h3>{t.name}</h3>
                  <p>
                    {t.target_minutes_per_day} min a day ·{" "}
                    {t.cadence_days_per_week} days a week · {t.current_streak}{" "}
                    day streak
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => onLogTime(t)}
                >
                  <Plus /> Log time
                </button>
              </div>
            ))}
          </section>
          <section className="panel">
            <h2>Recent sessions</h2>
            {tracks
              .flatMap((t) => t.streaks.map((s) => ({ ...s, name: t.name })))
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 30)
              .map((s) => (
                <div className="resource-row" key={s.id}>
                  <div>
                    <h3>{s.name}</h3>
                    <p>
                      {new Date(`${s.date}T12:00:00`).toLocaleDateString(
                        undefined,
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </p>
                  </div>
                  <strong>{s.minutes_logged} min</strong>
                </div>
              ))}
            {!tracks.some((t) => t.streaks.length > 0) && (
              <p className="empty-copy">
                No sessions logged yet. Add study time to keep a record of your
                work.
              </p>
            )}
          </section>
        </>
      ) : tracks.length ? (
        tracks.map((t) => (
          <section className="panel library-section" key={t.id}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">COURSE</span>
                <h2>{t.name}</h2>
              </div>
              <button className="btn btn-ghost" onClick={() => onSelect(t)}>
                Open course <BookOpen />
              </button>
            </div>
            {view === "practice" ? (
              t.units.some((u) => u.practice_items.length) ? (
                t.units
                  .filter((u) => u.practice_items.length)
                  .map((u) => (
                    <div className="practice-group" key={u.id}>
                      <h3>{u.title}</h3>
                      {u.practice_items.map((item) => (
                        <div className="resource-row" key={item.id}>
                          <button
                            className={`icon-button ${item.completed ? "success-text" : ""}`}
                            aria-label={`${item.completed ? "Mark incomplete" : "Complete"}: ${item.title}`}
                            onClick={() => onTogglePractice(u.id, item.id)}
                          >
                            {item.completed ? <CheckCircle2 /> : <Circle />}
                          </button>
                          <div>
                            <a href={item.url} target="_blank" rel="noreferrer">
                              {item.title} <ExternalLink />
                            </a>
                            {item.source_note && <p>{item.source_note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
              ) : (
                <p className="empty-copy">
                  Add practice resources from a lesson in this course.
                </p>
              )
            ) : t.projects.length ? (
              t.projects.map((p) => (
                <div className="resource-row" key={p.id}>
                  <FolderGit2 />
                  <div>
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                    <span className="status">
                      {p.status} · {p.source}
                    </span>
                  </div>
                  <a
                    className="btn btn-secondary"
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View project <ExternalLink />
                  </a>
                </div>
              ))
            ) : (
              <p className="empty-copy">
                Open this course to find project ideas for what you’re studying.
              </p>
            )}
          </section>
        ))
      ) : (
        <div className="empty-state">
          <BookOpen />
          <h3>No courses yet</h3>
          <p>Create a course in My learning to get started.</p>
          <a href="#learning" className="btn btn-primary">
            Go to My learning
          </a>
        </div>
      )}
    </div>
  );
}
