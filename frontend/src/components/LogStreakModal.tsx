import { useState } from "react";
import type { FormEvent } from "react";
import type { Track } from "../types";
import { Modal } from "./ui/dialog";
import { localDate } from "../lib/learning";
export function LogStreakModal({
  track,
  onClose,
  onSubmit,
}: {
  track: Track;
  onClose: () => void;
  onSubmit: (minutes: number, date: string) => Promise<void>;
}) {
  const [minutes, setMinutes] = useState(track.target_minutes_per_day || 30);
  const [date, setDate] = useState(localDate());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(minutes, date);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save your study time.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Log study time"
      description={track.name}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <label className="field">
          Study date
          <input
            type="date"
            required
            max={localDate()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <div className="quick-minutes">
          {[15, 30, 45, 60, 90].map((m) => (
            <button
              type="button"
              key={m}
              className={`btn ${m === minutes ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMinutes(m)}
            >
              {m}m
            </button>
          ))}
        </div>
        <label className="field">
          Minutes studied
          <input
            type="number"
            min={1}
            required
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </label>
        <p className="form-note">
          Your daily goal is {track.target_minutes_per_day} minutes.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save study session"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
