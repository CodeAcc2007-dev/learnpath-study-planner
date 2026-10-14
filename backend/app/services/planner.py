import os
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def _get_model_name() -> str:
    """Returns preferred model name from env or defaults to gemini-3.5-flash-lite."""
    return os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")

def _get_genai_client():
    """Returns Gemini client if API key is configured."""
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize google-genai client: {e}")
        return None

def cluster_videos_into_units(track_name: str, track_description: str, videos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Groups playlist videos into structured units based on topics, titles, descriptions, and transcripts.
    Each video item dictionary should contain: {'id': str, 'title': str, 'description': str, 'transcript': str}.
    """
    if not videos:
        return []

    client = _get_genai_client()
    if client:
        try:
            video_inputs = []
            for idx, v in enumerate(videos):
                video_inputs.append({
                    "id": v["id"],
                    "title": v.get("title", ""),
                    "description": (v.get("description") or "")[:300],
                    "transcript_snippet": (v.get("transcript") or "")[:500]
                })

            prompt = f"""You are an expert curriculum designer.
Analyze the following videos for the learning track "{track_name}" (Description: {track_description or 'N/A'}).
Group these videos into 3 to 8 logical, sequential units ordered by learning progression. Every video MUST be assigned to exactly one unit.

Videos:
{json.dumps(video_inputs, indent=2)}

Respond strictly with a JSON object in this format:
{{
  "units": [
    {{
      "title": "Descriptive Unit Title",
      "summary": "1-2 sentence summary of what this unit teaches",
      "video_ids": ["id1", "id2"],
      "order_index": 0
    }}
  ]
}}
"""
            response = client.models.generate_content(
                model=_get_model_name(),
                contents=prompt,
                config={
                    "response_mime_type": "application/json"
                }
            )
            data = json.loads(response.text)
            if "units" in data and isinstance(data["units"], list):
                return data["units"]
        except Exception as e:
            logger.error(f"LLM video clustering failed: {e}. Falling back to heuristic clustering.")

    # Fallback heuristic clustering: Group into chunks of 3-4 videos if LLM unavailable
    logger.info("Using heuristic clustering fallback.")
    units = []
    chunk_size = 4
    for i in range(0, len(videos), chunk_size):
        chunk = videos[i:i + chunk_size]
        order_idx = i // chunk_size
        v_ids = [v["id"] for v in chunk]
        first_title = chunk[0].get("title", f"Module {order_idx + 1}")
        
        # Strip common episode numbers
        clean_title = first_title.split("|")[0].split("-")[0].strip()
        units.append({
            "title": f"Unit {order_idx + 1}: {clean_title}",
            "summary": f"Key concepts covering {len(chunk)} video sessions starting with {clean_title}.",
            "video_ids": v_ids,
            "order_index": order_idx
        })

    return units

def generate_practice_items(unit_title: str, unit_summary: str, video_titles: List[str]) -> List[Dict[str, Any]]:
    """Generates practice resources and exercise recommendations for a unit."""
    client = _get_genai_client()
    if client:
        try:
            prompt = f"""You are an expert technical instructor.
For the learning unit: "{unit_title}"
Summary: {unit_summary}
Covered video topics: {', '.join(video_titles)}

Suggest 2 to 3 targeted practice resources or hands-on exercises (e.g. documentation tutorials, LeetCode / Kaggle search targets, Github exercise repos).

Respond strictly with a JSON object:
{{
  "practice_items": [
    {{
      "kind": "external",
      "title": "Title of exercise or reading resource",
      "url": "https://example.com or direct search link",
      "source_note": "Target concept to practice"
    }}
  ]
}}
"""
            response = client.models.generate_content(
                model=_get_model_name(),
                contents=prompt,
                config={
                    "response_mime_type": "application/json"
                }
            )
            data = json.loads(response.text)
            if "practice_items" in data and isinstance(data["practice_items"], list):
                return data["practice_items"]
        except Exception as e:
            logger.error(f"LLM practice item generation failed: {e}")

    # Fallback default items
    return [
        {
            "kind": "external",
            "title": f"Hands-on practice for {unit_title}",
            "url": f"https://www.google.com/search?q={unit_title.replace(' ', '+')}+tutorial+exercise",
            "source_note": "Search and complete hands-on coding exercises"
        },
        {
            "kind": "external",
            "title": "Documentation & Cheat Sheet Review",
            "url": "https://devdocs.io/",
            "source_note": "Review core function signatures and definitions"
        }
    ]

def suggest_projects_for_completed_units(track_name: str, completed_unit_titles: List[str]) -> List[Dict[str, Any]]:
    """Proposes Kaggle / GitHub practical projects unlocked by unit completion."""
    client = _get_genai_client()
    if client:
        try:
            prompt = f"""You are a senior tech mentor.
A student in track "{track_name}" has just completed these units: {', '.join(completed_unit_titles)}.

Propose 2 real-world portfolio projects (e.g. GitHub repos, Kaggle challenges, or open-source tasks) that consolidate these newly acquired skills.

Respond strictly in JSON:
{{
  "projects": [
    {{
      "title": "Project Name",
      "description": "Short project scope description",
      "source": "kaggle" or "github",
      "url": "https://github.com or https://kaggle.com direct link or search URL",
      "notes": "What skills this demonstrates"
    }}
  ]
}}
"""
            response = client.models.generate_content(
                model=_get_model_name(),
                contents=prompt,
                config={
                    "response_mime_type": "application/json"
                }
            )
            data = json.loads(response.text)
            if "projects" in data and isinstance(data["projects"], list):
                return data["projects"]
        except Exception as e:
            logger.error(f"LLM project suggestion failed: {e}")

    # Fallback default projects
    return [
        {
            "title": f"{track_name} Applied Portfolio Project",
            "description": f"Build a practical application implementing concepts from {', '.join(completed_unit_titles[:2])}.",
            "source": "github",
            "url": f"https://github.com/search?q={track_name.replace(' ', '+')}+project",
            "notes": "Build and push to GitHub repository"
        }
    ]
