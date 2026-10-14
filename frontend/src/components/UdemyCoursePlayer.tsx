import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Search,
  Plus,
  Clock,
  BookOpen,
  RefreshCw,
  Trash2,
  Lock,
} from "lucide-react";
import type { Track, Video } from "../types";
import { VideoPlayerFacade } from "./VideoPlayerFacade";
import { CourseReadings } from "./CourseReadings";
import readingCatalog from "../data/ml-readings.json";
import { AddPracticeModal } from "./AddPracticeModal";
import { AddPlaylistModal } from "./AddPlaylistModal";
import { LogStreakModal } from "./LogStreakModal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { courseStats, nextLesson, saveBookmark } from "../lib/learning";
interface Props {
  track: Track;
  allTracks: Track[];
  onBack: () => void;
  onRefreshTrack: () => Promise<void>;
  onToggleVideoCompleted: (id: string) => Promise<void>;
  onUpdateUnitStatus?: (id: string, status: string) => Promise<void>;
  onAddPracticeItem: (
    id: string,
    item: { title: string; url: string; source_note?: string },
  ) => Promise<void>;
  onTogglePracticeItem: (unit: string, item: string) => Promise<void>;
  onAddPlaylist: (url: string) => Promise<void>;
  onDeletePlaylist?: (id: string) => Promise<void>;
  onLogStreak: (minutes: number, date: string) => Promise<void>;
  onRecluster: () => Promise<void>;
  onSuggestProjects: () => Promise<void>;
}
export function UdemyCoursePlayer({
  track,
  allTracks,
  onBack,
  onToggleVideoCompleted,
  onUpdateUnitStatus,
  onAddPracticeItem,
  onTogglePracticeItem,
  onAddPlaylist,
  onDeletePlaylist,
  onLogStreak,
  onRecluster,
  onSuggestProjects,
}: Props) {
  const { videos, completed, total, percent } = courseStats(track);
  const [activeId, setActiveId] = useState(() => nextLesson(track)?.id);
  const [search, setSearch] = useState("");
  const [resourceTab, setResourceTab] = useState("overview");
  const hasBook = track.id === readingCatalog.trackId;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      track.units.map((u) => [
        u.id,
        !u.video_ids.includes(nextLesson(track)?.id || ""),
      ]),
    ),
  );
  const [modal, setModal] = useState<"practice" | "playlist" | "study" | null>(
    null,
  );
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const active = videos.find((v) => v.id === activeId) || nextLesson(track);
  const activeUnit = track.units.find((u) =>
    u.video_ids.includes(active?.id || ""),
  );
  const index = videos.findIndex((v) => v.id === active?.id);
  const selectVideo = (v: Video) => {
    setActiveId(v.id);
    saveBookmark(track.id, v.id);
    const unit = track.units.find((u) => u.video_ids.includes(v.id));
    if (unit) setCollapsed((p) => ({ ...p, [unit.id]: false }));
  };
  const run = async (key: string, fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The change could not be saved. Please try again.",
      );
    } finally {
      setBusy("");
    }
  };
  const duration = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const assignedIds = new Set(track.units.flatMap((u) => u.video_ids));
  const unassigned = videos.filter((v) => !assignedIds.has(v.id));
  const videoById = new Map(videos.map((video) => [video.id, video]));
  const groups = [
    ...track.units.map((u, i) => ({
      id: u.id,
      title: u.title,
      number: i + 1,
      videos: u.video_ids
        .map((id) => videoById.get(id))
        .filter((video): video is Video => Boolean(video)),
    })),
    ...(unassigned.length
      ? [
          {
            id: "unassigned",
            title: "Additional lessons",
            number: track.units.length + 1,
            videos: unassigned,
          },
        ]
      : []),
  ];
  const filteredGroups = groups
    .map((g) => ({
      ...g,
      filtered: g.videos.filter((v) =>
        `${g.title} ${v.title}`.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((g) => !search || g.filtered.length);
  return (
    <div className="course-player">
      <header className="player-header">
        <button className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft /> My learning
        </button>
        <div className="player-course-title">
          <span className="eyebrow">YOUR COURSE</span>
          <h1>{track.name}</h1>
        </div>
        <div className="player-header-progress">
          <span>
            {completed} / {total} lessons <strong>{percent}%</strong>
          </span>
          <progress
            value={completed}
            max={total || 1}
            aria-label="Course progress"
          />
        </div>
        <button className="btn btn-secondary" onClick={() => setModal("study")}>
          <Clock /> Log study
        </button>
        <button
          className="btn btn-primary"
          onClick={() => setModal("playlist")}
        >
          <Plus /> Add playlist
        </button>
      </header>
      {track.is_locked && (
        <div className="prerequisite-banner">
          <Lock />
          <span>
            Recommended first:{" "}
            {allTracks
              .filter((t) => track.prerequisite_track_ids.includes(t.id))
              .map((t) => t.name)
              .join(", ")}
            . You can still preview this course.
          </span>
        </div>
      )}
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <div className="player-layout">
        <section className="lesson-main">
          {active ? (
            <>
              <VideoPlayerFacade
                key={active.id}
                videoId={active.youtube_video_id}
                title={active.title}
                thumbnailUrl={active.thumbnail_url}
              />
              <div className="lesson-heading">
                <div>
                  <p className="eyebrow">
                    LESSON {index + 1} OF {total}{" "}
                    <span>· {duration(active.duration_s)}</span>
                  </p>
                  <h2>{active.title}</h2>
                </div>
                <button
                  className={`btn ${active.completed ? "btn-completed" : "btn-secondary"}`}
                  disabled={!!busy}
                  onClick={() =>
                    run("complete", () => onToggleVideoCompleted(active.id))
                  }
                >
                  {active.completed ? <CheckCircle2 /> : <Circle />}
                  {active.completed ? "Completed" : "Mark complete"}
                </button>
              </div>
              <div className="lesson-navigation">
                <button
                  className="btn btn-ghost"
                  disabled={index <= 0}
                  onClick={() => selectVideo(videos[index - 1])}
                >
                  <ChevronLeft /> Previous lesson
                </button>
                <span>{activeUnit?.title || "Course lessons"}</span>
                <button
                  className="btn btn-ghost"
                  disabled={index >= total - 1}
                  onClick={() => selectVideo(videos[index + 1])}
                >
                  Next lesson <ChevronRight />
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state player-empty">
              <BookOpen />
              <h2>Your classroom is ready.</h2>
              <p>Add a YouTube playlist to start filling it with lessons.</p>
              <button
                className="btn btn-primary"
                onClick={() => setModal("playlist")}
              >
                <Plus /> Add a playlist
              </button>
            </div>
          )}
          <Tabs value={resourceTab} onValueChange={setResourceTab} className="lesson-tabs">
            <TabsList aria-label="Lesson resources">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {hasBook && <TabsTrigger value="reading">Reading</TabsTrigger>}
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="practice">
                Practice <span>{activeUnit?.practice_items.length || 0}</span>
              </TabsTrigger>
              <TabsTrigger value="projects">
                Projects <span>{track.projects.length}</span>
              </TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              {hasBook && (
                <button className="reading-shortcut" onClick={() => setResourceTab("reading")}>
                  <BookOpen size={18} />
                  <span>Book readings <small>Topic PDFs matched to your lessons</small></span>
                  <ChevronRight size={18} />
                </button>
              )}
              <h3>About this lesson</h3>
              <p className="lesson-description">
                {active?.description ||
                  track.description ||
                  "No description has been added yet."}
              </p>
              {active && (
                <a
                  href={`https://www.youtube.com/watch?v=${active.youtube_video_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  Watch on YouTube <ExternalLink />
                </a>
              )}
              {activeUnit && (
                <div className="unit-summary">
                  <div>
                    <span className="eyebrow">CURRENT SECTION</span>
                    <h3>{activeUnit.title}</h3>
                    <p>{activeUnit.summary}</p>
                  </div>
                  {onUpdateUnitStatus && (
                    <label className="field">
                      Section status
                      <select
                        disabled={!!busy || track.is_locked}
                        value={activeUnit.status}
                        onChange={(e) =>
                          run("unit", () =>
                            onUpdateUnitStatus(activeUnit.id, e.target.value),
                          )
                        }
                      >
                        <option value="locked">Locked</option>
                        <option value="available">Not started</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Completed</option>
                      </select>
                    </label>
                  )}
                </div>
              )}
            </TabsContent>
            {hasBook && <TabsContent value="reading"><CourseReadings videoId={active?.youtube_video_id} /></TabsContent>}
            <TabsContent value="transcript">
              <h3>Lesson transcript</h3>
              <div className="transcript">
                {active?.transcript ||
                  "A transcript isn’t available for this lesson."}
              </div>
            </TabsContent>
            <TabsContent value="practice">
              <div className="section-heading">
                <h3>Practice for this section</h3>
                {activeUnit && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setModal("practice")}
                  >
                    <Plus /> Add resource
                  </button>
                )}
              </div>
              {activeUnit?.practice_items.length ? (
                activeUnit.practice_items.map((item) => (
                  <div className="resource-row" key={item.id}>
                    <button
                      className={`icon-button ${item.completed ? "success-text" : ""}`}
                      disabled={!!busy}
                      aria-label={`${item.completed ? "Mark incomplete" : "Complete"}: ${item.title}`}
                      onClick={() =>
                        run(item.id, () =>
                          onTogglePracticeItem(activeUnit.id, item.id),
                        )
                      }
                    >
                      {item.completed ? <CheckCircle2 /> : <Circle />}
                    </button>
                    <div>
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.title}
                        <ExternalLink />
                      </a>
                      {item.source_note && <p>{item.source_note}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-copy">
                  {activeUnit
                    ? "Add an exercise or a useful resource for this section."
                    : "Choose a lesson in a section to see its practice resources."}
                </p>
              )}
            </TabsContent>
            <TabsContent value="projects">
              <div className="section-heading">
                <h3>Put your skills to work</h3>
                <button
                  className="btn btn-secondary"
                  disabled={!!busy}
                  onClick={() => run("projects", onSuggestProjects)}
                >
                  <RefreshCw className={busy === "projects" ? "spin" : ""} />
                  {busy === "projects"
                    ? "Finding projects…"
                    : "Find project ideas"}
                </button>
              </div>
              {track.projects.length ? (
                track.projects.map((p) => (
                  <div className="project-resource" key={p.id}>
                    <span className="eyebrow">
                      {p.source} · {p.status}
                    </span>
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                    {p.notes && <p>{p.notes}</p>}
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-link"
                    >
                      View project <ExternalLink />
                    </a>
                  </div>
                ))
              ) : (
                <p className="empty-copy">
                  Find projects related to the topics in this course.
                </p>
              )}
            </TabsContent>
            <TabsContent value="playlists">
              <div className="section-heading">
                <h3>Course playlists</h3>
                <button
                  className="btn btn-secondary"
                  onClick={() => setModal("playlist")}
                >
                  <Plus /> Add playlist
                </button>
              </div>
              {track.playlists.length ? (
                track.playlists.map((p) => (
                  <div className="resource-row" key={p.id}>
                    <div>
                      <a
                        href={`https://www.youtube.com/playlist?list=${p.youtube_playlist_id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {p.title}
                        <ExternalLink />
                      </a>
                      <p>
                        {p.channel_name} · {p.videos.length} lessons
                      </p>
                    </div>
                    {onDeletePlaylist && (
                      <button
                        className="icon-button danger-text"
                        disabled={!!busy}
                        aria-label={`Remove ${p.title}`}
                        onClick={() => {
                          if (
                            confirm(
                              `Remove “${p.title}”? Its lessons and their saved completion will be deleted.`,
                            )
                          )
                            run(p.id, () => onDeletePlaylist(p.id));
                        }}
                      >
                        <Trash2 />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="empty-copy">No playlists added yet.</p>
              )}
            </TabsContent>
          </Tabs>
        </section>
        <aside className="curriculum">
          <div className="curriculum-header">
            <div className="section-heading">
              <h2>Course content</h2>
              <span>{track.units.length} sections</span>
            </div>
            <p>
              {completed} of {total} lessons completed
            </p>
            <progress
              value={completed}
              max={total || 1}
              aria-label="Lessons completed"
            />
            <label className="search-field">
              <Search />
              <input
                aria-label="Search lessons"
                placeholder="Find a lesson"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="curriculum-list">
            {filteredGroups.map((g) => (
              <section className="curriculum-section" key={g.id}>
                <button
                  className="section-toggle"
                  aria-expanded={!collapsed[g.id] || !!search}
                  onClick={() =>
                    setCollapsed((p) => ({ ...p, [g.id]: !p[g.id] }))
                  }
                >
                  <span className="section-number">
                    {String(g.number).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{g.title}</strong>
                    <small>
                      {g.videos.filter((v) => v.completed).length} /{" "}
                      {g.videos.length} lessons
                    </small>
                  </span>
                  <ChevronDown
                    className={collapsed[g.id] && !search ? "collapsed" : ""}
                  />
                </button>
                {(!collapsed[g.id] || search) &&
                  g.filtered.map((v) => (
                    <div
                      className={`curriculum-lesson ${v.id === active?.id ? "active" : ""}`}
                      key={v.id}
                    >
                      <button
                        className={`lesson-check ${v.completed ? "success-text" : ""}`}
                        disabled={!!busy}
                        aria-label={`${v.completed ? "Mark incomplete" : "Complete"}: ${v.title}`}
                        onClick={() =>
                          run(v.id, () => onToggleVideoCompleted(v.id))
                        }
                      >
                        {v.completed ? <CheckCircle2 /> : <Circle />}
                      </button>
                      <button
                        className="lesson-select"
                        onClick={() => selectVideo(v)}
                        aria-current={v.id === active?.id ? "true" : undefined}
                      >
                        <span>{v.title}</span>
                        <small>{duration(v.duration_s)}</small>
                      </button>
                    </div>
                  ))}
              </section>
            ))}
            {!filteredGroups.length && (
              <p className="empty-copy">
                {search
                  ? "No lessons match your search."
                  : "Add a playlist to see your course content."}
              </p>
            )}
          </div>
          {track.playlists.length > 0 && (
            <div className="curriculum-footer">
              <button
                className="btn btn-ghost"
                disabled={!!busy}
                onClick={() => {
                  if (
                    confirm(
                      "Reorganizing replaces existing sections and practice items, including their progress. Lesson completion is retained. Continue?",
                    )
                  )
                    run("organize", onRecluster);
                }}
              >
                <RefreshCw className={busy === "organize" ? "spin" : ""} />
                {busy === "organize" ? "Organizing…" : "Reorganize sections"}
              </button>
            </div>
          )}
        </aside>
      </div>
      {modal === "practice" && activeUnit && (
        <AddPracticeModal
          unitTitle={activeUnit.title}
          onClose={() => setModal(null)}
          onSubmit={(item) => onAddPracticeItem(activeUnit.id, item)}
        />
      )}
      {modal === "playlist" && (
        <AddPlaylistModal
          trackName={track.name}
          onClose={() => setModal(null)}
          onSubmit={onAddPlaylist}
        />
      )}
      {modal === "study" && (
        <LogStreakModal
          track={track}
          onClose={() => setModal(null)}
          onSubmit={onLogStreak}
        />
      )}
    </div>
  );
}
