from extensions import db
from services.language_service import detect_language
from services.difficulty_service import compute_difficulty


# Compute and store a song's language + difficulty so it can be filtered in Discovery.
# Safe to call repeatedly; only fills in fields that are missing.
def ensure_song_stats(song, lyrics):
  if not song or not lyrics:
    return

  changed = False

  if not song.language:
    song.language = detect_language(lyrics)
    changed = True

  if song.difficulty_level is None:
    difficulty = compute_difficulty(lyrics, song.language or "en")
    if difficulty:
      song.difficulty_level = difficulty["level"]
      song.difficulty_score = difficulty["score"]
      changed = True

  if changed:
    db.session.commit()
