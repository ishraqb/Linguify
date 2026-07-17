import requests

#Deezeer Search API - returns 30s audio preview (Spotify no longer supports that)
DEEZER_SEARCH_URL = "https://api.deezer.com/search"

def get_preview_url(title, artist):
  response = requests.get(
    DEEZER_SEARCH_URL,
    params={"q": f"{artist} {title}"},
    timeout=10,
  )
  response.raise_for_status()
  results = response.json().get("data", [])
  for track in results:
    if track.get("preview"):
      return track["preview"]
  return None