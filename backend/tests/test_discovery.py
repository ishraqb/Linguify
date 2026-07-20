from models import Song
from extensions import db
from services.discovery_service import discover_songs


# Insert a catalog song with known discovery stats.
def _add_song(title, artist, language, level, lyrics="la la la", explicit=False):
  song = Song(
    title=title,
    artist=artist,
    lyrics=lyrics,
    language=language,
    difficulty_level=level,
    difficulty_score=50,
    explicit=explicit,
  )
  db.session.add(song)
  db.session.commit()
  return song


# Filtering by language returns only songs in that language.
def test_discover_filters_by_language(app_ctx):
  _add_song("A", "x", "es", "Beginner")
  _add_song("B", "y", "fr", "Advanced")

  results = discover_songs(language="es")

  assert [song["title"] for song in results] == ["A"]


# Catalog songs are browsable even without lyrics, but songs without a known
# language (not yet part of the catalog) are excluded.
def test_discover_includes_catalog_songs_without_lyrics(app_ctx):
  db.session.add(Song(title="Catalog Song", artist="x", language="es", cover_url="http://c"))
  db.session.add(Song(title="Unknown", artist="y"))
  db.session.commit()

  titles = [song["title"] for song in discover_songs()]
  assert "Catalog Song" in titles
  assert "Unknown" not in titles


# Explicit songs are hidden when the caller opts out; NULL/clean songs remain.
def test_discover_hides_explicit_when_excluded(app_ctx):
  _add_song("Clean", "x", "es", "Beginner", explicit=False)
  _add_song("Dirty", "y", "es", "Beginner", explicit=True)

  titles = [song["title"] for song in discover_songs(include_explicit=False)]
  assert titles == ["Clean"]
