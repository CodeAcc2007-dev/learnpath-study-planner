import { useState } from "react";
import type { FormEvent } from "react";
import type { Track } from "../types";
import { Modal } from "./ui/dialog";
interface Props {
  existingTrack?: Track | null;
  allTracks: Track[];
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    prerequisite_track_ids: string[];
    cadence_days_per_week: number;
    target_minutes_per_day: number;
  }) => Promise<void>;
}
export function CreateTrackModal({
  existingTrack,
  allTracks,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState(existingTrack?.name || "");
  const [description, setDescription] = useState(
    existingTrack?.description || "",
  );
  const [days, setDays] = useState(existingTrack?.cadence_days_per_week || 5);
  const [minutes, setMinutes] = useState(
    existingTrack?.target_minutes_per_day || 30,
  );
  const [prereqs, setPrereqs] = useState(
    existingTrack?.prerequisite_track_ids || [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        cadence_days_per_week: days,
        target_minutes_per_day: minutes,
        prerequisite_track_ids: prereqs,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the course.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={existingTrack ? "Edit course" : "Create a course"}
      description="Choose a subject and a study rhythm that works for you."
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <label className="field">
          Course name
          <input
            required
            maxLength={160}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Machine Learning"
          />
        </label>
        <label className="field">
          Description
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What would you like to learn?"
          />
        </label>
        <div className="form-grid">
          <label className="field">
            Days per week
            <input
              type="number"
              required
              min={1}
              max={7}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </label>
          <label className="field">
            Minutes per day
            <input
              type="number"
              required
              min={5}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </label>
        </div>
        {allTracks.some((t) => t.id !== existingTrack?.id) && (
          <fieldset className="prereq-field">
            <legend>
              Prerequisites <span>Optional</span>
            </legend>
            <p>Courses to finish before starting this one.</p>
            {allTracks
              .filter((t) => t.id !== existingTrack?.id)
              .map((t) => (
                <label className="checkbox-label" key={t.id}>
                  <input
                    type="checkbox"
                    checked={prereqs.includes(t.id)}
                    onChange={(e) =>
                      setPrereqs(
                        e.target.checked
                          ? [...prereqs, t.id]
                          : prereqs.filter((id) => id !== t.id),
                      )
                    }
                  />
                  {t.name}
                </label>
              ))}
          </fieldset>
        )}
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy || !name.trim()}>
            {busy
              ? "Saving…"
              : existingTrack
                ? "Save changes"
                : "Create course"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
