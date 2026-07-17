from models import Song
from extensions import db
from services.discovery_service import discover_songs, available_languages


# Insert a catalog song with known discovery stats.
def _add_song(title, artist, language, level, lyrics="la la la"):
  song = Song(
    title=title,
    artist=artist,
    lyrics=lyrics,
    language=language,
    difficulty_level=level,
    difficulty_score=50,
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


# Filtering by difficulty level returns only matching songs.
def test_discover_filters_by_difficulty(app_ctx):
  _add_song("A", "x", "es", "Beginner")
  _add_song("B", "y", "es", "Advanced")

  results = discover_songs(difficulty="Advanced")

  assert [song["title"] for song in results] == ["B"]


# The text query matches on either title or artist.
def test_discover_text_query_matches_title_or_artist(app_ctx):
  _add_song("Despacito", "Luis Fonsi", "es", "Beginner")
  _add_song("Imagine", "John Lennon", "en", "Beginner")

  assert [song["title"] for song in discover_songs(query="despa")] == ["Despacito"]
  assert [song["title"] for song in discover_songs(query="lennon")] == ["Imagine"]


# Catalog songs are browsable even without lyrics, but songs without a known
# language (not yet part of the catalog) are excluded.
def test_discover_includes_catalog_songs_without_lyrics(app_ctx):
  db.session.add(Song(title="Catalog Song", artist="x", language="es", cover_url="http://c"))
  db.session.add(Song(title="Unknown", artist="y"))
  db.session.commit()

  titles = [song["title"] for song in discover_songs()]
  assert "Catalog Song" in titles
  assert "Unknown" not in titles


# Available languages are distinct and sorted.
def test_available_languages_returns_distinct_sorted(app_ctx):
  _add_song("A", "x", "es", "Beginner")
  _add_song("B", "y", "fr", "Beginner")
  _add_song("C", "z", "es", "Beginner")

  assert available_languages() == ["es", "fr"]
