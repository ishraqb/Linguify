import os
import requests

GENIUS_SEARCH_URL = "https://api.genius.com/search"

def search_song_metadata(title,artist):
  token = os.environ.get("GENIUS_ACCESS_TOKEN")

  if not token:
    raise RuntimeError("Missing GENIUS_ACCESS_TOKEN environment variable")
  query = f"{title} {artist}"
  response = requests.get(
    GENIUS_SEARCH_URL,
    headers={"Authorization": f"Bearer {token}"},
    params={"q": query},
    timeout=10,
  )
  response.raise_for_status()
  data = response.json()

  hits = data.get("response", {}).get("hits", [])

  if not hits:
    return None
  song = hits[0].get("result", {})
  return {
    "genius_id": str(song.get("id")),
    "title": song.get("title"),
    "artist": song.get("primary_artist", {}).get("name"),
    "url": song.get("url"),
    "thumbnail": song.get("song_art_image_thumbnail_url"),
  }