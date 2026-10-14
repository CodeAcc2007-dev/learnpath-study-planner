import re
import logging
from typing import Dict, List, Any, Optional
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

logger = logging.getLogger(__name__)

def extract_playlist_id(url_or_id: str) -> str:
    """Extract YouTube playlist ID from full URL or return ID directly."""
    if not url_or_id:
        raise ValueError("Playlist URL or ID cannot be empty.")
    
    # Check for playlist ID in query params
    match = re.search(r"[?&]list=([^&]+)", url_or_id)
    if match:
        return match.group(1)
    
    # If it's already an ID string
    if re.match(r"^[A-Za-z0-9_-]{10,}$", url_or_id):
        return url_or_id
        
    return url_or_id.strip()

def fetch_video_transcript(video_id: str) -> Optional[str]:
    """Fetch transcript text for a video using youtube-transcript-api."""
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.fetch(video_id)
        text_lines = [item.text if hasattr(item, 'text') else item.get('text', '') for item in transcript_list]
        return " ".join(text_lines)
    except (TranscriptsDisabled, NoTranscriptFound) as e:
        logger.info(f"No transcript found for video {video_id}: {e}")
        return None
    except Exception as e:
        logger.warning(f"Error fetching transcript for video {video_id}: {e}")
        return None

def fetch_playlist_metadata(url_or_id: str) -> Dict[str, Any]:
    """
    Extract playlist details and video list using yt-dlp.
    Returns: {
      "playlist_id": str,
      "title": str,
      "channel_name": str,
      "video_count": int,
      "videos": [
         {
           "youtube_video_id": str,
           "title": str,
           "description": str,
           "duration_s": int,
           "position": int,
           "thumbnail_url": str,
           "transcript": str | None
         }
      ]
    }
    """
    playlist_id = extract_playlist_id(url_or_id)
    playlist_url = f"https://www.youtube.com/playlist?list={playlist_id}"

    ydl_opts = {
        'extract_flat': 'in_playlist',
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
        'ignoreerrors': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(playlist_url, download=False)
        except Exception as e:
            logger.error(f"yt-dlp failed for playlist {playlist_id}: {e}")
            raise ValueError(f"Could not extract YouTube playlist: {e}")

    if not info:
        raise ValueError("Failed to retrieve playlist information.")

    playlist_title = info.get('title', f"Playlist {playlist_id}")
    uploader = info.get('uploader') or info.get('playlist_uploader') or "Unknown Creator"
    entries = info.get('entries', [])

    videos = []
    position = 0
    for entry in entries:
        if not entry or not entry.get('id'):
            continue
        v_id = entry.get('id')
        v_title = entry.get('title') or 'Untitled Video'
        v_desc = entry.get('description', '')
        v_duration = int(entry.get('duration') or 0)
        
        # Thumbnail selection
        thumbnails = entry.get('thumbnails', [])
        thumb_url = f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg"
        if thumbnails:
            thumb_url = thumbnails[-1].get('url', thumb_url)

        # Attempt transcript fetch
        transcript = fetch_video_transcript(v_id)

        videos.append({
            "youtube_video_id": v_id,
            "title": v_title,
            "description": v_desc[:1500] if v_desc else "",
            "duration_s": v_duration,
            "position": position,
            "thumbnail_url": thumb_url,
            "transcript": transcript[:4000] if transcript else None
        })
        position += 1

    return {
        "playlist_id": playlist_id,
        "title": playlist_title,
        "channel_name": uploader,
        "video_count": len(videos),
        "videos": videos
    }
