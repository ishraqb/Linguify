import requests
from models import Song, Translation
from extensions import db

MYMEMORY_URL = "https://api.mymemory.translated.net/get"

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

def translate_lines(lyrics, target_language, source_language="auto"):
  lines = [line.strip() for line in lyrics.splitlines() if line.strip()]
  translated_lines = []
  for line in lines:
    translated = translate_text(
      line,
      source_lang=source_language,
      target_lang=target_language,
    )
    translated_lines.append({
      "original": line,
      "translation": translated or "",
    })
  return translated_lines

def get_or_create_translation(song_id, target_language, source_language="auto"):
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