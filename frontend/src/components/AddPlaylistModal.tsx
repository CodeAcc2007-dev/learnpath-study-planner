import { useState } from "react";
import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "./ui/dialog";
export function AddPlaylistModal({
  trackName,
  onClose,
  onSubmit,
}: {
  trackName: string;
  onClose: () => void;
  onSubmit: (url: string) => Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(url.trim());
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not import this playlist.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Add a playlist"
      description={`Add lessons to ${trackName}.`}
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
          YouTube playlist link or ID
          <input
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/playlist?list=…"
            disabled={busy}
          />
        </label>
        <p className="form-note">
          Lessons will be organized into sections with transcripts and practice
          resources where available. Large playlists can take a few minutes.
        </p>
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy || !url.trim()}>
            {busy ? (
              <>
                <Loader2 className="spin" /> Importing lessons…
              </>
            ) : (
              "Import playlist"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
