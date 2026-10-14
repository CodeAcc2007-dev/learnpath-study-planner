import { useEffect, useRef, useState } from "react";
import { Play, BookOpen, ExternalLink, RotateCcw, LoaderCircle } from "lucide-react";
import { loadYouTube, playbackError } from "../lib/youtube";
import type { YouTubePlayer } from "../lib/youtube";

function EmbeddedLesson({ videoId, title }: { videoId: string; title: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading YouTube…");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let disposed = false;
    let player: YouTubePlayer | undefined;
    const fail = (message: string) => {
      if (disposed) return;
      window.clearTimeout(timeout);
      setFailed(true);
      setStatus(message);
    };
    const timeout = window.setTimeout(() => fail(
      "YouTube is taking too long to respond. Try again or open the lesson on YouTube.",
    ), 20000);

    loadYouTube().then((api) => {
      if (disposed || !container.current) return;
      const target = document.createElement("div");
      container.current.replaceChildren(target);
      player = new api.Player(target, {
        host: "https://www.youtube-nocookie.com",
        videoId,
        playerVars: {
          autoplay: 1, rel: 0, playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (disposed) return;
            window.clearTimeout(timeout);
            setFailed(false);
            setStatus("");
          },
          onError: ({ data }) => fail(playbackError(data)),
          onAutoplayBlocked: () => {
            if (disposed) return;
            window.clearTimeout(timeout);
            setFailed(false);
            setStatus("Press play in the video to start this lesson.");
          },
        },
      });
      const iframe = player.getIframe();
      iframe.title = title;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
    }).catch((error: unknown) => fail(error instanceof Error ? error.message : "YouTube couldn’t load."));

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      player?.destroy();
    };
  }, [videoId, title, attempt]);

  return (
    <div className="lesson-video">
      <div className="video-frame">
        <div ref={container} className="youtube-mount" />
        {status === "Loading YouTube…" && (
          <div className="video-loading" aria-hidden="true"><LoaderCircle size={28} /></div>
        )}
      </div>
      <div className="video-status">
        <span role={failed ? "alert" : "status"}>{status}</span>
        <div className="video-actions">
          <button type="button" onClick={() => {
            setFailed(false);
            setStatus("Loading YouTube…");
            setAttempt((value) => value + 1);
          }}><RotateCcw size={14} /> Retry video</button>
          <a href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`} target="_blank" rel="noopener noreferrer">
            Open on YouTube <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

export function VideoPlayerFacade({ videoId, title, thumbnailUrl }: {
  videoId: string; title: string; thumbnailUrl?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  if (playing) return <EmbeddedLesson key={videoId} videoId={videoId} title={title} />;
  return (
    <div className="video-frame">
      <button className="video-poster" aria-label={`Play ${title}`} onClick={() => setPlaying(true)}>
        {!imageFailed ? (
          <img src={thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" onError={() => setImageFailed(true)} />
        ) : <BookOpen className="video-fallback" />}
        <span className="video-shade" />
        <span className="play-button"><Play fill="currentColor" /></span>
        <span className="video-caption">Play lesson</span>
      </button>
    </div>
  );
}
