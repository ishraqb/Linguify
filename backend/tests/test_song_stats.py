from models import Song
from extensions import db
from services.song_stats_service import ensure_song_stats


# ensure_song_stats fills in language and difficulty from the lyrics.
def test_ensure_song_stats_sets_language_and_difficulty(app_ctx):
  lyrics = "Yo quiero bailar toda la noche contigo mi amor bajo la luna llena"
  song = Song(title="T", artist="A", lyrics=lyrics)
  db.session.add(song)
  db.session.commit()

  ensure_song_stats(song, lyrics)

  assert song.language == "es"
  assert song.difficulty_level in ("Beginner", "Intermediate", "Advanced")
  assert song.difficulty_score is not None


# ensure_song_stats does not overwrite values that are already set.
def test_ensure_song_stats_preserves_existing(app_ctx):
  song = Song(
    title="T",
    artist="A",
    lyrics="whatever",
    language="fr",
    difficulty_level="Advanced",
    difficulty_score=90,
  )
  db.session.add(song)
  db.session.commit()

  ensure_song_stats(song, "whatever")

  assert song.language == "fr"
  assert song.difficulty_level == "Advanced"
