import re
import requests
from models import Song
from extensions import db
from services.song_stats_service import ensure_song_stats

LRCLIB_SEARCH_URL = "https://lrclib.net/api/search"

# Matches an LRCLIB timestamp like [00:12.34] at the start of a synced line.
_TIMESTAMP_RE = re.compile(r"\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]")


# Parse LRCLIB synced lyrics into ordered {time (seconds), text} entries.
def parse_synced_lyrics(synced_lyrics):
  if not synced_lyrics:
    return []

  parsed = []
  for line in synced_lyrics.split("\n"):
    match = _TIMESTAMP_RE.match(line.strip())
    if not match:
      continue
    minutes = int(match.group(1))
    seconds = int(match.group(2))
    fraction = float(f"0.{match.group(3)}") if match.group(3) else 0.0
    time = minutes * 60 + seconds + fraction
    text = _TIMESTAMP_RE.sub("", line).strip()
    parsed.append({"time": round(time, 2), "text": text})
  return parsed

def fetch_lyrics_from_lrclib(title, artist):
  response = requests.get(
    LRCLIB_SEARCH_URL,
    params={"track_name": title, "artist_name": artist},
    timeout=10
  )
  response.raise_for_status()
  results = response.json() 
  if not results:
    return None
  best_match = results[0]
  return {
    "plain": best_match.get("plainLyrics"),
    "synced": best_match.get("syncedLyrics"),
  }


def get_or_fetch_lyrics(title, artist, spotify_track_id=None, album=None, cover_url=None):
  song = None

  if spotify_track_id:
    song = Song.query.filter_by(spotify_track_id=spotify_track_id).first()
  if not song:
    song = Song.query.filter_by(title=title, artist=artist).first()
  if song and song.lyrics:
    # Backfill discovery stats for songs stored before this feature existed.
    ensure_song_stats(song, song.lyrics)
    return {
      "song_id": song.id,
      "title": song.title,
      "artist": song.artist,
      "lyrics": song.lyrics,
      "synced_lyrics": song.synced_lyrics,
      "synced_lines": parse_synced_lyrics(song.synced_lyrics),
      "cached": True
    }
  fetched = fetch_lyrics_from_lrclib(title, artist)
  if not fetched or not (fetched["plain"] or fetched["synced"]):
    return None
  lyrics = fetched["plain"] or fetched["synced"]
  synced = fetched["synced"]
  if not song:
    song = Song(
      spotify_track_id=spotify_track_id,
      title=title,
      artist=artist,
      album=album,
      lyrics=lyrics,
      synced_lyrics=synced,
      cover_url=cover_url,
    )
    db.session.add(song)
  else:
    song.lyrics = lyrics
    song.synced_lyrics = synced
    if spotify_track_id and not song.spotify_track_id:
      song.spotify_track_id = spotify_track_id
    if album and not song.album:
      song.album = album
    if cover_url and not song.cover_url:
      song.cover_url = cover_url
  db.session.commit()
  # Compute language + difficulty once so the song shows up in Discovery.
  ensure_song_stats(song, lyrics)
  return {
    "song_id": song.id,
    "title": song.title,
    "artist": song.artist,
    "lyrics": song.lyrics,
    "synced_lyrics": song.synced_lyrics,
    "synced_lines": parse_synced_lyrics(song.synced_lyrics),
    "cached": False
  }