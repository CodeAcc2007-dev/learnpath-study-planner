import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Modal } from "./ui/dialog";

GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfReader({ url, title, initialPage, onClose }: {
  url: string; title: string; initialPage: number; onClose: () => void;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(initialPage);
  const [labels, setLabels] = useState<string[] | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageText, setPageText] = useState("");
  const canvasHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    const task = getDocument({ url });
    task.promise.then(async (document) => {
      const pageLabels = await document.getPageLabels();
      if (disposed) return;
      setLabels(pageLabels);
      setPage((current) => Math.max(1, Math.min(current, document.numPages)));
      setPdf(document);
    }).catch(() => {
      if (!disposed) {
        setLoading(false);
        setError("This reading couldn’t load. Download the PDF to read it locally.");
      }
    });
    return () => { disposed = true; void task.destroy(); };
  }, [url]);

  useEffect(() => {
    if (!pdf) return;
    let disposed = false;
    let render: RenderTask | undefined;
    setLoading(true);
    setError("");
    setPageText("");
    pdf.getPage(page).then(async (pdfPage) => {
      if (disposed || !canvasHost.current) return;
      const viewport = pdfPage.getViewport({ scale: 1.6 * zoom });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.width = `${100 * zoom}%`;
      canvas.setAttribute("aria-label", `Book page ${labels?.[page - 1] || page}`);
      canvas.setAttribute("role", "img");
      canvasHost.current.replaceChildren(canvas);
      render = pdfPage.render({ canvas, viewport });
      await render.promise;
      const content = await pdfPage.getTextContent();
      if (!disposed) {
        setPageText(content.items.map((item) => "str" in item ? item.str : "").join(" "));
        setLoading(false);
      }
    }).catch((reason: unknown) => {
      if (!disposed && !(reason instanceof Error && reason.name === "RenderingCancelledException")) {
        setError("This page couldn’t render. Try another page or download the PDF.");
        setLoading(false);
      }
    });
    return () => { disposed = true; render?.cancel(); };
  }, [pdf, page, zoom, labels]);

  return (
    <Modal title={title} description="Original pages from your course book" className="pdf-reader" onClose={onClose}>
      <div className="pdf-toolbar">
        <div className="pdf-pagination">
          <button className="icon-button" disabled={!pdf || page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous PDF page"><ChevronLeft /></button>
          <label>Page <select aria-label="PDF page" value={page} disabled={!pdf} onChange={(event) => setPage(Number(event.target.value))}>
            {Array.from({length: pdf?.numPages || initialPage}, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}
          </select> / {pdf?.numPages || "…"}</label>
          <button className="icon-button" disabled={!pdf || page >= pdf.numPages} onClick={() => setPage((current) => current + 1)} aria-label="Next PDF page"><ChevronRight /></button>
        </div>
        <span className="pdf-book-page">Book p. {labels?.[page - 1] || "…"}</span>
        <select aria-label="PDF zoom" value={zoom} onChange={(event) => setZoom(Number(event.target.value))}>
          <option value={1}>Fit width</option><option value={1.25}>125%</option><option value={1.5}>150%</option>
        </select>
        <a className="text-link" href={url} download><Download size={16} /> Download PDF</a>
      </div>
      {loading && <p role="status" className="pdf-status">Loading page…</p>}
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="pdf-canvas" ref={canvasHost} aria-busy={loading} />
      {pageText && <details className="pdf-page-text"><summary>Page text</summary><p>{pageText}</p></details>}
    </Modal>
  );
}
