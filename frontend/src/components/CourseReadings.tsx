import { lazy, Suspense, useState } from "react";
import { BookOpen, Download, ExternalLink, Search } from "lucide-react";
import catalogData from "../data/ml-readings.json";

type Reading = {
  topicId: string; section: string; coverage: string; note: string;
  pdfPage: number; printedPages: string;
};
type LessonReading = { number: number; title: string; readings: Reading[]; note: string };
const lessons: Record<string, LessonReading> = catalogData.lessons;
const topics = new Map(catalogData.topics.map((topic) => [topic.id, topic]));
const PdfReader = lazy(() => import("./PdfReader"));

export function CourseReadings({ videoId }: { videoId?: string }) {
  const [query, setQuery] = useState("");
  const [openReading, setOpenReading] = useState<{ topicId: string; page: number } | null>(null);
  const openTopic = openReading ? topics.get(openReading.topicId) : undefined;
  const lesson = videoId ? lessons[videoId] : undefined;
  const filteredTopics = catalogData.topics.filter((topic) =>
    `${topic.title} ${topic.chapter}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="course-readings">
      <div className="reading-book">
        <BookOpen aria-hidden="true" />
        <div>
          <h3>{catalogData.bookTitle}</h3>
          <p>{catalogData.author} · {catalogData.edition}</p>
        </div>
      </div>
      <h3>{lesson ? `Reading for lesson ${lesson.number}` : "Lesson reading"}</h3>
      <p className="reading-context">Original book pages, grouped by topic. Page numbers refer to your supplied edition; its code examples use older library versions.</p>
      {lesson?.note && <p className="reading-note">{lesson.note}</p>}
      {lesson?.readings.length ? (
        <div className="reading-list">
          {lesson.readings.map((reading, index) => {
            const topic = topics.get(reading.topicId);
            if (!topic) return null;
            return (
              <article className="reading-resource" key={`${reading.topicId}-${index}`}>
                <div className="reading-meta">
                  <span>Chapter {topic.chapter} · Book pp. {reading.printedPages}</span>
                  <span className="reading-match">{reading.coverage === "direct" ? "Direct match" : reading.coverage === "partial" ? "Partial coverage" : "Background reading"}</span>
                </div>
                <h4>{reading.section}</h4>
                {reading.note && <p>{reading.note}</p>}
                <div className="reading-actions">
                  <button className="text-link" onClick={() => setOpenReading({ topicId: topic.id, page: reading.pdfPage })}>Open reading <BookOpen size={14} /></button>
                  <a className="text-link" href={topic.url} download><Download size={14} /> Download topic · {topic.pageCount} pages</a>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-copy">{lesson ? "No matching excerpt is attached to this lecture. Browse the topic library below for other readings." : "Choose a mapped lesson to see its reading, or browse the topic library below."}</p>
      )}
      <details className="reading-library">
        <summary>All {catalogData.topics.length} topic PDFs</summary>
        <label className="reading-search"><Search size={16} /><input aria-label="Search book topics" placeholder="Find a book topic" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="reading-list">
          {filteredTopics.map((topic) => (
            <article className="reading-resource" key={topic.id}>
              <h4>{topic.title}</h4>
              <p>Chapter {topic.chapter} · Book pp. {topic.printedRanges} · {topic.pageCount} pages</p>
              <div className="reading-actions">
                <button className="text-link" onClick={() => setOpenReading({ topicId: topic.id, page: 1 })}>Open PDF <ExternalLink size={14} /></button>
                <a className="text-link" href={topic.url} download aria-label={`Download ${topic.title}`}><Download size={14} /> Download</a>
              </div>
            </article>
          ))}
          {!filteredTopics.length && <p className="empty-copy">No topics match “{query}”.</p>}
        </div>
      </details>
      {openTopic && openReading && (
        <Suspense fallback={<p role="status">Opening reader…</p>}>
          <PdfReader key={`${openTopic.id}-${openReading.page}`} url={openTopic.url} title={openTopic.title} initialPage={openReading.page} onClose={() => setOpenReading(null)} />
        </Suspense>
      )}
    </div>
  );
}
