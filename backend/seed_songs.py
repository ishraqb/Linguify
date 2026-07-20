"""Populate the Discover catalog from curated per-language song lists.

Run once from the backend folder:  python seed_songs.py

Each song is looked up on Spotify (via the app-only client credentials flow) to
attach cover art and a track ID, then stored tagged with its language. Lyrics
and difficulty are filled in later, the first time a song is actually studied.
It also backfills cover art for any existing songs that are missing it.

Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in the environment.
"""

from app import create_app
from data.catalog_songs import CATALOG
from models import Song
from extensions import db
from services.lyrics_service import get_or_fetch_lyrics
import spotify_client as sp


# Create or update a catalog song, attaching Spotify cover art and track ID.
def _upsert_song(title, artist, language, token):
  try:
    track = sp.find_track(token, title, artist)
  except Exception:
    track = None

  cover = track.get("coverUrl") if track else None
  track_id = track.get("id") if track else None

  song = None
  if track_id:
    song = Song.query.filter_by(spotify_track_id=track_id).first()
  if not song:
    song = Song.query.filter_by(title=title, artist=artist).first()
  if not song:
    song = Song(
      title=(track.get("title") if track else title) or title,
      artist=(track.get("artist") if track else artist) or artist,
    )
    db.session.add(song)

  if not song.language:
    song.language = language
  if cover and not song.cover_url:
    song.cover_url = cover
  if track_id and not song.spotify_track_id:
    song.spotify_track_id = track_id
  if track and song.explicit is None:
    song.explicit = track.get("explicit", False)

  db.session.commit()

  # Fetch lyrics up front so difficulty is computed now and the Discover filter is useful.
  # LRCLIB-only (use_fallback=False) keeps seeding fast; slower providers fill in when studied.
  if song.difficulty_level is None:
    try:
      get_or_fetch_lyrics(
        song.title, song.artist,
        spotify_track_id=song.spotify_track_id,
        cover_url=song.cover_url,
        use_fallback=False,
      )
    except Exception:
      pass

  return bool(track)


# Fill in cover art for existing songs that don't have one yet.
def _backfill_covers(token):
  filled = 0
  for song in Song.query.filter(Song.cover_url.is_(None)).all():
    try:
      track = sp.find_track(token, song.title, song.artist)
    except Exception:
      track = None
    if track and track.get("coverUrl"):
      song.cover_url = track["coverUrl"]
      if not song.spotify_track_id and track.get("id"):
        song.spotify_track_id = track["id"]
      filled += 1
  db.session.commit()
  return filled


def main():
  app = create_app()
  with app.app_context():
    token = sp.get_app_token()

    added = 0
    missing = 0
    for language, songs in CATALOG.items():
      for title, artist in songs:
        found = _upsert_song(title, artist, language, token)
        if found:
          added += 1
        else:
          missing += 1
          print(f"  no Spotify match: {title} - {artist}")

    backfilled = _backfill_covers(token)

    print(f"\nDone. {added} catalog songs stored, {missing} not found on Spotify.")
    print(f"Backfilled cover art for {backfilled} existing songs.")


if __name__ == "__main__":
  main()
