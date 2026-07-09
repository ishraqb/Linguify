import requests
from models import Song
from extensions import db

LRCLIB_SEARCH_URL = "http://lrclib.net/api/search"

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
  best_match = resulst[0]
  return best_match.get("syncedLyrics") or best_match.get("plainLyrics")
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
      "cached": True
    }
  lyrics = fetch_lyrics_from_lrclib(title, artist)
  if not lyrics:
    return None
  if not song: 
    song = Song(
      spotify_track_id=spotify_track_id,
      title=title,
      artist=artist,
      album=album,
      lyrics=lyrics
    )
    db.session.add(song)
  else: 
    song.lyrics = lyrics
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
    "cached": False
  }