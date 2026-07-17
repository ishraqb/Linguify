import requests
from models import Song, Translation, WordTranslation
from extensions import db

MYMEMORY_URL = "https://api.mymemory.translated.net/get"

# Cap kept high enough to cover full songs; repeated lines are only translated once.
MAX_TRANSLATION_LINES = 120

def translate_text(text, source_lang="en", target_lang="en"):
  response = requests.get(
    MYMEMORY_URL,
    params={
      "q": text,
      "langpair": f"{source_lang}|{target_lang}",
    },
    timeout=10,
  )
  response.raise_for_status()
  data = response.json()
  return data.get("responseData", {}).get("translatedText")

def translate_lines(lyrics, target_language, source_language="en"):
  lines = [line.strip() for line in lyrics.splitlines() if line.strip()]
  lines = lines[:MAX_TRANSLATION_LINES]

  if source_language == target_language:
    return [
      {
        "original": line,
        "translation": line,
      }
      for line in lines
    ]

  # Translate each distinct line only once so repeated choruses don't re-hit the API.
  translation_cache = {}

  for line in lines:
    if line in translation_cache:
      continue
    try:
      translated = translate_text(
        line,
        source_lang=source_language,
        target_lang=target_language,
      )
    except requests.RequestException:
      translated = "Translation unavailable"
    translation_cache[line] = translated or "Translation unavailable"

  return [
    {"original": line, "translation": translation_cache[line]}
    for line in lines
  ]

# Look up a single word's translation, caching the result so repeat taps skip the API.
def get_or_create_word_translation(word, source_language, target_language):
  normalized = word.strip().lower()

  cached = WordTranslation.query.filter_by(
    word=normalized,
    source_language=source_language,
    target_language=target_language,
  ).first()
  if cached:
    return cached.translation

  translated = translate_text(
    word,
    source_lang=source_language,
    target_lang=target_language,
  )
  if not translated:
    return None

  entry = WordTranslation(
    word=normalized,
    source_language=source_language,
    target_language=target_language,
    translation=translated,
  )
  db.session.add(entry)
  db.session.commit()
  return translated

def get_or_create_translation(song_id, target_language, source_language="en"):
  song = Song.query.get(song_id)
  if not song:
    return None

  cached_translation = Translation.query.filter_by(
    song_id=song_id,
    target_language=target_language,
  ).first()
  if cached_translation:
    return {
      "song_id": song.id,
      "title": song.title,
      "artist": song.artist,
      "target_language": target_language,
      "translated_lyrics": cached_translation.translated_lyrics,
      "cached": True,
    }

  if not song.lyrics:
    return None

  translated_lines = translate_lines(
    song.lyrics,
    target_language=target_language,
    source_language=source_language,
  )
  translated_text = "\n".join(
    f"{item['original']} || {item['translation']}"
    for item in translated_lines
  )

  has_real_translation = any(
    item["translation"] != "Translation unavailable"
    and item["translation"] != item["original"]
    for item in translated_lines
  )

  if not has_real_translation:
    return {
      "song_id": song.id,
      "title": song.title,
      "artist": song.artist,
      "target_language": target_language,
      "translated_lyrics": translated_text,
      "cached": False,
    }

  new_translation = Translation(
    song_id=song.id,
    target_language=target_language,
    translated_lyrics=translated_text,
  )
  db.session.add(new_translation)
  db.session.commit()

  return {
    "song_id": song.id,
    "title": song.title,
    "artist": song.artist,
    "target_language": target_language,
    "translated_lyrics": translated_text,
    "cached": False,
  }