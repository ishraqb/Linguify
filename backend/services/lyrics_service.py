import requests
from models import Song
from extensions import db

LRCLIB_SEARCH_URL = "https://lrclib.net/api/search"

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


def get_or_fetch_lyrics(title, artist, spotify_track_id=None, album=None):
  song = None

  if spotify_track_id:
    song = Song.query.filter_by(spotify_track_id=spotify_track_id).first()
  if not song:
    song = Song.query.filter_by(title=title, artist=artist).first()
  if song and song.lyrics:
    return {
      "song_id": song.id,
      "title": song.title,
      "artist": song.artist,
      "lyrics": song.lyrics,
      "synced_lyrics": song.synced_lyrics,
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
      synced_lyrics=synced
    )
    db.session.add(song)
  else:
    song.lyrics = lyrics
    song.synced_lyrics = synced
    if spotify_track_id and not song.spotify_track_id:
      song.spotify_track_id = spotify_track_id
    if album and not song.album:
      song.album = album
  db.session.commit()
  return {
    "song_id": song.id,
    "title": song.title,
    "artist": song.artist,
    "lyrics": song.lyrics,
    "synced_lyrics": song.synced_lyrics,
    "cached": False
  }