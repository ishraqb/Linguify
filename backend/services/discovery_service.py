from sqlalchemy import or_
from models import Song
from extensions import db


# Shape a Song row into the fields the Discover UI needs.
def _serialize(song):
  return {
    "id": song.spotify_track_id,
    "songId": song.id,
    "title": song.title,
    "artist": song.artist,
    "album": song.album,
    "coverUrl": song.cover_url,
    "language": song.language,
    "difficulty": song.difficulty_level,
    "difficultyScore": song.difficulty_score,
    "explicit": bool(song.explicit),
  }


# Filter the stored song catalog by language, difficulty level, and a text query.
# Catalog songs are browsable even before their lyrics are fetched, so we key on
# having a known language rather than on lyrics being present.
# Uses ORM filters (parameterized) so user input can't be injected into SQL.
def discover_songs(language=None, difficulty=None, query=None, include_explicit=True, limit=60):
  songs = Song.query.filter(Song.language.isnot(None))

  if language:
    songs = songs.filter(Song.language == language)
  if difficulty:
    songs = songs.filter(Song.difficulty_level == difficulty)
  if not include_explicit:
    # Treat unknown (NULL) as safe so only tracks flagged explicit are hidden.
    songs = songs.filter(or_(Song.explicit.is_(False), Song.explicit.is_(None)))
  if query:
    like = f"%{query}%"
    songs = songs.filter(or_(Song.title.ilike(like), Song.artist.ilike(like)))

  songs = songs.order_by(Song.created_at.desc()).limit(limit).all()
  return [_serialize(song) for song in songs]


# Distinct languages present in the catalog, so the UI only offers real filters.
def available_languages():
  rows = (
    db.session.query(Song.language)
    .filter(Song.language.isnot(None))
    .distinct()
    .all()
  )
  return sorted(code for (code,) in rows if code)
