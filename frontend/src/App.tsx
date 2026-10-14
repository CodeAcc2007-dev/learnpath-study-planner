import { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { LearningDashboard } from "./components/LearningDashboard";
import { WorkspaceViews } from "./components/WorkspaceViews";
import { UdemyCoursePlayer } from "./components/UdemyCoursePlayer";
import { CreateTrackModal } from "./components/CreateTrackModal";
import { LogStreakModal } from "./components/LogStreakModal";
import type { Track } from "./types";
import {
  fetchTracks,
  createTrack,
  updateTrack,
  deleteTrack,
  addPlaylist,
  deletePlaylist,
  updateUnitStatus,
  addPracticeItem,
  togglePracticeItem,
  toggleVideoCompleted,
  logStreak,
  reclusterTrack,
  suggestProjects,
} from "./api";
import { AlertCircle, Loader2 } from "lucide-react";

export function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [view, setView] = useState(
    () => window.location.hash.slice(1) || "learning",
  );
  const selectedTrackId = view.startsWith("course/") ? view.slice(7) : null;
  const setSelectedTrackId = (id: string | null) => {
    window.location.hash = id ? `course/${id}` : "learning";
  };
  useEffect(() => {
    const sync = () => setView(window.location.hash.slice(1) || "learning");
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [logStreakTrack, setLogStreakTrack] = useState<Track | null>(null);

  const loadTracks = async () => {
    try {
      const data = await fetchTracks();
      setTracks(data);
      setError("");
    } catch {
      setError(
        "Your courses couldn’t be loaded. Check the connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, []);

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);

  const handleCreateOrUpdateTrack = async (data: {
    name: string;
    description: string;
    prerequisite_track_ids: string[];
    cadence_days_per_week: number;
    target_minutes_per_day: number;
  }) => {
    if (editingTrack) {
      await updateTrack(editingTrack.id, data);
    } else {
      await createTrack(data);
    }
    await loadTracks();
    setEditingTrack(null);
  };

  const handleDeleteTrack = async (id: string) => {
    try {
      await deleteTrack(id);
    } catch {
      setActionError("The course could not be deleted. Please try again.");
      return;
    }
    if (selectedTrackId === id) setSelectedTrackId(null);
    await loadTracks();
  };

  const handleAddPlaylist = async (urlOrId: string) => {
    if (!selectedTrackId) return;
    await addPlaylist(selectedTrackId, urlOrId);
    await loadTracks();
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    await deletePlaylist(playlistId);
    await loadTracks();
  };

  // Update immediately, then reconcile server-derived section and prerequisite state.
  const handleToggleVideoCompleted = async (videoId: string) => {
    setTracks((prevTracks) =>
      prevTracks.map((tr) => ({
        ...tr,
        playlists: tr.playlists.map((pl) => ({
          ...pl,
          videos: pl.videos.map((v) =>
            v.id === videoId ? { ...v, completed: !v.completed } : v,
          ),
        })),
      })),
    );
    try {
      await toggleVideoCompleted(videoId);
      await loadTracks();
    } catch (e) {
      await loadTracks();
      setActionError("Your change could not be saved. Please try again.");
      throw e;
    }
  };

  const handleUpdateUnitStatus = async (unitId: string, status: string) => {
    setTracks((prevTracks) =>
      prevTracks.map((tr) => ({
        ...tr,
        units: tr.units.map((u) =>
          u.id === unitId
            ? { ...u, status: status as Track["units"][number]["status"] }
            : u,
        ),
      })),
    );
    try {
      await updateUnitStatus(unitId, status);
      await loadTracks();
    } catch (e) {
      await loadTracks();
      setActionError("Your change could not be saved. Please try again.");
      throw e;
    }
  };

  const handleAddPracticeItem = async (
    unitId: string,
    item: { title: string; url: string; source_note?: string },
  ) => {
    await addPracticeItem(unitId, item);
    await loadTracks();
  };

  const handleTogglePracticeItem = async (unitId: string, itemId: string) => {
    setTracks((prevTracks) =>
      prevTracks.map((tr) => ({
        ...tr,
        units: tr.units.map((u) =>
          u.id === unitId
            ? {
                ...u,
                practice_items: u.practice_items.map((pi) =>
                  pi.id === itemId ? { ...pi, completed: !pi.completed } : pi,
                ),
              }
            : u,
        ),
      })),
    );
    try {
      await togglePracticeItem(unitId, itemId);
    } catch (e) {
      await loadTracks();
      setActionError("Your change could not be saved. Please try again.");
      throw e;
    }
  };

  const handleLogStreak = async (minutes: number, dateStr: string) => {
    const tId = logStreakTrack?.id || selectedTrackId;
    if (!tId) return;
    await logStreak(tId, minutes, dateStr);
    await loadTracks();
  };

  const handleRecluster = async () => {
    if (!selectedTrackId) return;
    await reclusterTrack(selectedTrackId);
    await loadTracks();
  };

  const handleSuggestProjects = async () => {
    if (!selectedTrackId) return;
    await suggestProjects(selectedTrackId);
    await loadTracks();
  };

  const openCreate = () => {
    setEditingTrack(null);
    setShowCreateModal(true);
  };
  const openEdit = (track: Track) => {
    setEditingTrack(track);
    setShowCreateModal(true);
  };
  return (
    <div className={`app-shell ${selectedTrack ? "player-shell" : ""}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      {!selectedTrack && (
        <Navbar tracks={tracks} view={view} onOpenCreateTrack={openCreate} />
      )}
      <main id="main-content" tabIndex={-1} className="app-main">
        {!selectedTrack && (
          <div className="topbar">
            <span>
              Workspace <span className="breadcrumb-separator">/</span>{" "}
              {view === "learning"
                ? "My learning"
                : view === "practice"
                  ? "Practice"
                  : view === "projects"
                    ? "Projects"
                    : "Study activity"}
            </span>
            <time>
              {new Date().toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "long",
              })}
            </time>
          </div>
        )}
        {actionError && (
          <div className="error-banner" role="alert">
            {actionError}
            <button
              className="btn btn-ghost"
              onClick={() => setActionError("")}
            >
              Dismiss
            </button>
          </div>
        )}
        {loading ? (
          <div className="empty-state" role="status">
            <Loader2 className="spin" />
            <p>Loading your courses…</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <AlertCircle />
            <h2>Unable to load courses</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadTracks}>
              Try again
            </button>
          </div>
        ) : selectedTrack ? (
          <UdemyCoursePlayer
            key={selectedTrack.id}
            track={selectedTrack}
            allTracks={tracks}
            onBack={() => setSelectedTrackId(null)}
            onRefreshTrack={loadTracks}
            onToggleVideoCompleted={handleToggleVideoCompleted}
            onUpdateUnitStatus={handleUpdateUnitStatus}
            onAddPracticeItem={handleAddPracticeItem}
            onTogglePracticeItem={handleTogglePracticeItem}
            onAddPlaylist={handleAddPlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onLogStreak={handleLogStreak}
            onRecluster={handleRecluster}
            onSuggestProjects={handleSuggestProjects}
          />
        ) : ["practice", "projects", "activity"].includes(view) ? (
          <WorkspaceViews
            view={view}
            tracks={tracks}
            onSelect={(t) => setSelectedTrackId(t.id)}
            onLogTime={setLogStreakTrack}
            onTogglePractice={async (unit, id) => {
              try {
                await handleTogglePracticeItem(unit, id);
              } catch {
                /* The action banner reports save failures. */
              }
            }}
          />
        ) : (
          <LearningDashboard
            tracks={tracks}
            onCreate={openCreate}
            onSelect={(t) => setSelectedTrackId(t.id)}
            onLogTime={setLogStreakTrack}
            onEdit={openEdit}
            onDelete={handleDeleteTrack}
          />
        )}
      </main>
      {/* Global Modals */}
      {(showCreateModal || editingTrack) && (
        <CreateTrackModal
          existingTrack={editingTrack}
          allTracks={tracks}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTrack(null);
          }}
          onSubmit={handleCreateOrUpdateTrack}
        />
      )}

      {logStreakTrack && (
        <LogStreakModal
          track={logStreakTrack}
          onClose={() => setLogStreakTrack(null)}
          onSubmit={async (min, dateStr) => {
            await logStreak(logStreakTrack.id, min, dateStr);
            await loadTracks();
          }}
        />
      )}
    </div>
  );
}
