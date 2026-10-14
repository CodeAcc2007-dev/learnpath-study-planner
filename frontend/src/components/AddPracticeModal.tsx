import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "./ui/dialog";
export function AddPracticeModal({
  unitTitle,
  onClose,
  onSubmit,
}: {
  unitTitle: string;
  onClose: () => void;
  onSubmit: (item: {
    title: string;
    url: string;
    source_note?: string;
    kind?: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        url: url.trim(),
        source_note: note.trim() || undefined,
        kind: "external",
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add this resource.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Add practice resource"
      description={unitTitle}
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
          Title
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Linear regression exercises"
          />
        </label>
        <label className="field">
          Resource link
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label className="field">
          Note <span>Optional</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What to focus on"
          />
        </label>
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy || !title.trim()}>
            {busy ? "Adding…" : "Add resource"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
