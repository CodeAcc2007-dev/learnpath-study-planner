import { useState } from "react";
import {
  ArrowRight,
  Plus,
  Search,
  Play,
  Clock,
  Check,
  BookOpen,
} from "lucide-react";
import type { Track } from "../types";
import {
  courseStats,
  lastCourseId,
  nextLesson,
  localDate,
} from "../lib/learning";
import { TrackCard } from "./TrackCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
interface Props {
  tracks: Track[];
  onCreate: () => void;
  onSelect: (t: Track) => void;
  onLogTime: (t: Track) => void;
  onEdit: (t: Track) => void;
  onDelete: (id: string) => void;
}
export function StudyWeek({ tracks }: { tracks: Track[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + i);
    return d;
  });
  const minutes = days.map((d) =>
    tracks.reduce(
      (n, t) =>
        n +
        t.streaks
          .filter((s) => s.date === localDate(d))
          .reduce((n, s) => n + s.minutes_logged, 0),
      0,
    ),
  );
  return (
    <div className="study-week">
      <div className="section-label">
        <span>This week</span>
        <Clock />
      </div>
      <div className="week-total">
        {minutes.reduce((n, m) => n + m, 0)} <span>minutes studied</span>
      </div>
      <div className="week-days">
        {days.map((d, i) => (
          <div
            key={i}
            className={`week-day ${localDate(d) === localDate() ? "today" : ""}`}
          >
            <span>{d.toLocaleDateString("en", { weekday: "narrow" })}</span>
            <span
              className={`day-circle ${minutes[i] > 0 ? "studied" : ""}`}
              title={`${d.toLocaleDateString()}: ${minutes[i]} minutes`}
            >
              {minutes[i] > 0 ? <Check /> : d.getDate()}
            </span>
          </div>
        ))}
      </div>
      <p>
        {minutes.some((m) => m > 0)
          ? "Small sessions add up. Keep going."
          : "A fresh week. Make time for one lesson."}
      </p>
    </div>
  );
}
export function LearningDashboard({
  tracks,
  onCreate,
  onSelect,
  onLogTime,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const recent =
    tracks.find(
      (t) =>
        t.id === lastCourseId() && !t.is_locked && courseStats(t).total > 0,
    ) ||
    tracks.find(
      (t) =>
        !t.is_locked &&
        courseStats(t).completed > 0 &&
        courseStats(t).percent < 100,
    ) ||
    tracks.find((t) => !t.is_locked && courseStats(t).total > 0);
  const lesson = recent && nextLesson(recent);
  const matches = tracks.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()),
  );
  const inProgress = (t: Track) => {
    const s = courseStats(t);
    return s.completed > 0 && s.completed < s.total;
  };
  const isCompleted = (t: Track) => {
    const s = courseStats(t);
    return s.total > 0 && s.completed === s.total;
  };
  const filtered = matches.filter(
    (t) =>
      filter === "all" ||
      (filter === "progress" ? inProgress(t) : isCompleted(t)),
  );
  return (
    <div className="page dashboard">
      <header className="page-heading">
        <div>
          <p className="eyebrow">YOUR PERSONAL CLASSROOM</p>
          <h1>My learning</h1>
          <p>Pick up where you left off.</p>
        </div>
        <button className="btn btn-primary" onClick={onCreate}>
          <Plus /> New course
        </button>
      </header>
      <div className="dashboard-top">
        {recent && lesson ? (
          <section className="continue-card">
            <div className="continue-topline">
              <span className="eyebrow">CONTINUE LEARNING</span>
              <span>{courseStats(recent).percent}% complete</span>
            </div>
            <h2>{recent.name}</h2>
            <p className="continue-lesson">{lesson.title}</p>
            <div className="continue-bottom">
              <button
                className="btn btn-light"
                onClick={() => onSelect(recent)}
              >
                <Play fill="currentColor" /> Resume lesson <ArrowRight />
              </button>
              <span>
                <Clock /> {Math.max(1, Math.round(lesson.duration_s / 60))} min
                · Lesson{" "}
                {courseStats(recent).videos.findIndex(
                  (v) => v.id === lesson.id,
                ) + 1}
              </span>
            </div>
            <div className="continue-pattern" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </section>
        ) : (
          <section className="continue-card">
            <span className="eyebrow">A PLACE FOR YOUR NEXT CHAPTER</span>
            <h2>Make room for learning.</h2>
            <p className="continue-lesson">
              Bring your playlists together, one course at a time.
            </p>
            <button
              className="btn btn-light"
              onClick={tracks.length ? () => onSelect(tracks[0]) : onCreate}
            >
              <Plus /> {tracks.length ? "Add lessons" : "Create a course"}
            </button>
          </section>
        )}
        <StudyWeek tracks={tracks} />
      </div>
      <section className="course-library">
        <div className="section-heading">
          <h2>
            Your courses <span className="count">{tracks.length}</span>
          </h2>
          <label className="search-field">
            <Search />
            <input
              aria-label="Search courses"
              placeholder="Search courses"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button aria-label="Clear search" onClick={() => setSearch("")}>
                ×
              </button>
            )}
          </label>
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList aria-label="Filter courses">
            <TabsTrigger value="all">
              All courses <span>{tracks.length}</span>
            </TabsTrigger>
            <TabsTrigger value="progress">
              In progress <span>{tracks.filter(inProgress).length}</span>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed <span>{tracks.filter(isCompleted).length}</span>
            </TabsTrigger>
          </TabsList>
          {["all", "progress", "completed"].map((value) => (
            <TabsContent value={value} key={value}>
              {filtered.length ? (
                <div className="course-grid">
                  {filtered.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      allTracks={tracks}
                      onSelect={onSelect}
                      onLogTime={onLogTime}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <BookOpen />
                  <h3>
                    {search
                      ? "No matching courses"
                      : tracks.length
                        ? "No courses here yet"
                        : "Start your first course"}
                  </h3>
                  <p>
                    {search
                      ? "Try another title or clear your search."
                      : tracks.length
                        ? "Your courses will appear here as you make progress."
                        : "Create a course and add a playlist to begin."}
                  </p>
                  {!tracks.length && (
                    <button className="btn btn-primary" onClick={onCreate}>
                      Create a course
                    </button>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </section>
      <footer className="page-footer">
        Built around your curiosity.<span>Learn at your own pace.</span>
      </footer>
    </div>
  );
}
