export type YouTubePlayer = {
  destroy: () => void;
  getIframe: () => HTMLIFrameElement;
};

type YouTubeAPI = {
  Player: new (element: HTMLElement, options: {
    host: string;
    videoId: string;
    playerVars: Record<string, string | number>;
    events: {
      onReady: () => void;
      onError: (event: { data: number }) => void;
      onAutoplayBlocked: () => void;
    };
  }) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeAPI;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let pending: Promise<YouTubeAPI> | undefined;

export function loadYouTube(): Promise<YouTubeAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (pending) return pending;
  pending = new Promise<YouTubeAPI>((resolve, reject) => {
    const script = document.createElement("script");
    const previous = window.onYouTubeIframeAPIReady;
    const cleanup = () => {
      window.clearTimeout(timer);
      window.onYouTubeIframeAPIReady = previous;
      script.onerror = null;
    };
    const fail = () => {
      cleanup();
      script.remove();
      pending = undefined;
      reject(new Error("YouTube couldn’t load. Check your connection or open the lesson on YouTube."));
    };
    const timer = window.setTimeout(fail, 15000);
    window.onYouTubeIframeAPIReady = () => {
      cleanup();
      if (window.YT?.Player) resolve(window.YT);
      else fail();
      previous?.();
    };
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return pending;
}

export function playbackError(code: number): string {
  if (code === 100) return "This video is private or no longer available on YouTube.";
  if (code === 101 || code === 150) return "This lesson’s creator only allows playback on YouTube.";
  if (code === 153) return "YouTube couldn’t verify this embedded player. Open the lesson on YouTube.";
  if (code === 2) return "This lesson has an invalid YouTube video link.";
  return `YouTube couldn’t play this lesson (error ${code}). Try again or open it on YouTube.`;
}
