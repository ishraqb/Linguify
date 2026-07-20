import os
import requests

# YouTube Data API v3 - used for the public video search fallback
YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

def _api_key():
  return os.environ.get("YOUTUBE_API_KEY")

# Whether a YouTube API key is configured (search is unavailable without one).
def is_configured():
  return bool(_api_key())

def search_videos(query, limit=10):
  resp = requests.get(
    f"{YOUTUBE_API_BASE}/search",
    params={
      "part": "snippet",
      "q": query,
      "type": "video",
      "maxResults": limit,
      "videoEmbeddable": "true",
      "safeSearch": "moderate",
      "key": _api_key(),
    },
    timeout=10,
  )
  resp.raise_for_status()
  return resp.json()

def simplify_video(item):
  if not item:
    return None

  snippet = item.get("snippet", {})
  thumbnails = snippet.get("thumbnails", {})
  thumbnail = thumbnails.get("medium") or thumbnails.get("default") or {}

  return {
    "id": item.get("id", {}).get("videoId"),
    "title": snippet.get("title"),
    "channelTitle": snippet.get("channelTitle"),
    "thumbnailUrl": thumbnail.get("url", ""),
    "publishedAt": snippet.get("publishedAt"),
  }
