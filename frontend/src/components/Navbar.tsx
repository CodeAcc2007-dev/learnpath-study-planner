import {
  BookOpen,
  Library,
  ListChecks,
  FolderGit2,
  ChartNoAxesCombined,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import type { Track } from "../types";
import { SidebarLight } from "./ui/sidebar-light";
import { courseStats } from "../lib/learning";
export function Navbar({
  tracks,
  view,
  onOpenCreateTrack,
}: {
  tracks: Track[];
  view: string;
  onOpenCreateTrack: () => void;
}) {
  const completed = tracks.reduce((n, t) => n + courseStats(t).completed, 0);
  const total = tracks.reduce((n, t) => n + courseStats(t).total, 0);
  return (
    <aside className="app-sidebar">
      <a href="#learning" className="brand">
        <span className="brand-mark">
          <BookOpen />
        </span>
        LearnPath<span className="brand-dot">.</span>
      </a>
      <div className="sidebar-body">
        <p className="eyebrow sidebar-label">YOUR WORKSPACE</p>
        <SidebarLight
          activeHref={`#${view}`}
          items={[
            {
              title: "My learning",
              href: "#learning",
              icon: Library,
              count: tracks.length,
            },
            { title: "Practice", href: "#practice", icon: ListChecks },
            { title: "Projects", href: "#projects", icon: FolderGit2 },
            {
              title: "Study activity",
              href: "#activity",
              icon: ChartNoAxesCombined,
            },
          ]}
        />
        <div className="sidebar-courses">
          <p className="eyebrow sidebar-label">YOUR COURSES</p>
          {tracks.map((t, i) => (
            <a
              href={`#course/${t.id}`}
              key={t.id}
              className={`course-shortcut ${view === `course/${t.id}` ? "active" : ""}`}
            >
              <span className={`course-dot dot-${i % 3}`} />
              {t.name}
            </a>
          ))}
          <button className="sidebar-add" onClick={onOpenCreateTrack}>
            <Plus /> Add a course
          </button>
        </div>
      </div>
      <div className="sidebar-bottom">
        <div className="sidebar-progress">
          <BookOpen />
          <strong>A little, every day.</strong>
          <p>
            {completed} of {total} lessons completed
          </p>
          <progress
            value={completed}
            max={total || 1}
            aria-label="Overall lesson progress"
          />
        </div>
        <a className="workspace-footer" href="#activity">
          <span className="avatar">LP</span>
          <span>
            Personal workspace<small>Your learning, at your pace</small>
          </span>
          <ArrowUpRight />
        </a>
      </div>
    </aside>
  );
}
