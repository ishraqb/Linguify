import requests

#Deezeer Search API - returns 30s audio preview (Spotify no longer supports that)
DEEZER_SEARCH_URL = "https://api.deezer.com/search"


# Look up a track on Deezer, returning its 30s preview and album cover (if any).
def get_track_media(title, artist):
  response = requests.get(
    DEEZER_SEARCH_URL,
    params={"q": f"{artist} {title}"},
    timeout=10,
  )
  response.raise_for_status()
  results = response.json().get("data", [])
  preview_url = None
  cover_url = None
  for track in results:
    if preview_url is None and track.get("preview"):
      preview_url = track["preview"]
    album = track.get("album") or {}
    if cover_url is None:
      cover_url = album.get("cover_xl") or album.get("cover_big") or album.get("cover_medium")
    if preview_url and cover_url:
      break
  return {"preview_url": preview_url, "cover_url": cover_url}


def get_preview_url(title, artist):
  return get_track_media(title, artist).get("preview_url")