import re
import requests
import syncedlyrics
from models import Song, Translation
from extensions import db
from services.song_stats_service import ensure_song_stats

LRCLIB_SEARCH_URL = "https://lrclib.net/api/search"

# Matches an LRCLIB timestamp like [00:12.34] at the start of a synced line.
_TIMESTAMP_RE = re.compile(r"\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]")

# Splits a joined artist string ("Bad Bunny, JHAYCO", "Kanye West & Chris Martin").
_ARTIST_SPLIT_RE = re.compile(r"\s*(?:,|&|;|/|\bfeat\.?\b|\bft\.?\b|\bwith\b|\bx\b)\s*", re.IGNORECASE)


# The lead artist, so lyric lookups still work for multi-artist tracks.
def _primary_artist(artist):
  if not artist:
    return artist
  parts = _ARTIST_SPLIT_RE.split(artist)
  return parts[0].strip() if parts and parts[0].strip() else artist


# Return the first LRCLIB result that actually carries lyrics.
def _pick_lrclib_result(results):
  for result in results or []:
    if result.get("plainLyrics") or result.get("syncedLyrics"):
      return {"plain": result.get("plainLyrics"), "synced": result.get("syncedLyrics")}
  return None


# Some lyric providers return each line duplicated or bilingual, joined by a
# caret ("linea^linea" or "original^translation"). Real lyrics never contain a
# caret, so keep only the text before it — preserving any leading [mm:ss.xx]
# timestamp — to avoid the doubled lines we saw cached for some songs.
def _dedupe_caret(text):
  if not text or "^" not in text:
    return text
  cleaned = []
  for line in text.split("\n"):
    index = line.find("^")
    cleaned.append(line[:index].rstrip() if index != -1 else line)
  return "\n".join(cleaned)


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
  primary = _primary_artist(artist)
  # Try the full artist string first, then just the lead artist as a fallback.
  queries = [{"track_name": title, "artist_name": artist}]
  if primary and primary != artist:
    queries.append({"track_name": title, "artist_name": primary})

  for params in queries:
    response = requests.get(LRCLIB_SEARCH_URL, params=params, timeout=10)
    response.raise_for_status()
    picked = _pick_lrclib_result(response.json())
    if picked:
      return picked
  return None


# Fallback that aggregates several lyric providers (NetEase, Megalobiz, etc.).
def fetch_lyrics_from_syncedlyrics(title, artist):
  try:
    result = syncedlyrics.search(f"{title} {artist}")
  except Exception:
    return None
  if not result:
    return None
  # A result with [mm:ss] tags is synced; otherwise treat it as plain lyrics.
  if _TIMESTAMP_RE.search(result):
    plain = "\n".join(line["text"] for line in parse_synced_lyrics(result) if line["text"])
    return {"plain": plain or None, "synced": result}
  return {"plain": result, "synced": None}


# Try LRCLIB first (best synced quality), then fall back to other providers.
# use_fallback=False keeps it LRCLIB-only (fast) for bulk seeding.
def fetch_lyrics(title, artist, use_fallback=True):
  try:
    fetched = fetch_lyrics_from_lrclib(title, artist)
  except requests.RequestException:
    fetched = None
  if fetched and (fetched.get("plain") or fetched.get("synced")):
    return fetched
  if not use_fallback:
    return None
  return fetch_lyrics_from_syncedlyrics(title, artist)


def get_or_fetch_lyrics(title, artist, spotify_track_id=None, album=None, cover_url=None, use_fallback=True):
  song = None

  if spotify_track_id:
    song = Song.query.filter_by(spotify_track_id=spotify_track_id).first()
  if not song:
    song = Song.query.filter_by(title=title, artist=artist).first()
  if song and song.lyrics:
    # Heal any song cached with the caret-doubled lyrics: clean it in place and
    # drop its stale translations so they regenerate from the clean text.
    clean_lyrics = _dedupe_caret(song.lyrics)
    clean_synced = _dedupe_caret(song.synced_lyrics)
    if clean_lyrics != song.lyrics or clean_synced != song.synced_lyrics:
      song.lyrics = clean_lyrics
      song.synced_lyrics = clean_synced
      Translation.query.filter_by(song_id=song.id).delete()
      db.session.commit()
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
  fetched = fetch_lyrics(title, artist, use_fallback=use_fallback)
  if not fetched or not (fetched.get("plain") or fetched.get("synced")):
    return None
  lyrics = _dedupe_caret(fetched.get("plain") or fetched.get("synced"))
  synced = _dedupe_caret(fetched.get("synced"))
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