import os
import requests
from concurrent.futures import ThreadPoolExecutor
from models import Song, Translation, WordTranslation
from extensions import db
from services.language_service import detect_language

MYMEMORY_URL = "https://api.mymemory.translated.net/get"
# DeepL free tier endpoint; the key comes from the DEEPL_API_KEY env var.
DEEPL_URL = "https://api-free.deepl.com/v2/translate"

# Base language codes DeepL can translate (used to decide when to fall back).
DEEPL_SUPPORTED = {
  "ar", "bg", "cs", "da", "de", "el", "en", "es", "et", "fi", "fr", "hu",
  "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "pt", "ro", "ru",
  "sk", "sl", "sv", "tr", "uk", "zh",
}

# DeepL requires a regional variant for a few target languages.
DEEPL_TARGET_OVERRIDES = {"en": "EN-US", "pt": "PT-PT"}

# Cap kept high enough to cover full songs; repeated lines are only translated once.
MAX_TRANSLATION_LINES = 120

# How many MyMemory line requests to run at once. Line-by-line would take ~1s
# each (a full song can be 40+ lines), which blows past request timeouts; a
# small pool keeps the total to a few seconds without hammering the free API.
_MYMEMORY_WORKERS = 8


# Translate one string via DeepL; raises on error so the caller can fall back.
def _translate_deepl(text, source_lang, target_lang, api_key):
  results = _translate_deepl_batch([text], source_lang, target_lang, api_key)
  return results[0] if results else None


# Translate many strings in a single DeepL call (up to 50) so full songs stay
# fast. Returns translations aligned to the input order.
def _translate_deepl_batch(texts, source_lang, target_lang, api_key):
  target = DEEPL_TARGET_OVERRIDES.get(target_lang, target_lang.upper())
  data = [("text", text) for text in texts]
  data.append(("target_lang", target))
  if source_lang:
    data.append(("source_lang", source_lang.upper()))
  # API key is sent in an auth header and never logged (secrets-in-logs rule).
  response = requests.post(
    DEEPL_URL,
    data=data,
    headers={"Authorization": f"DeepL-Auth-Key {api_key}"},
    timeout=20,
  )
  response.raise_for_status()
  translations = response.json().get("translations") or []
  return [item.get("text") for item in translations]


# Translate one string using the free MyMemory API.
def _translate_mymemory(text, source_lang, target_lang):
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


# Translate a string via DeepL when possible, falling back to MyMemory.
def translate_text(text, source_lang="en", target_lang="en"):
  api_key = os.environ.get("DEEPL_API_KEY")
  if api_key and source_lang in DEEPL_SUPPORTED and target_lang in DEEPL_SUPPORTED:
    try:
      translated = _translate_deepl(text, source_lang, target_lang, api_key)
      if translated:
        return translated
    except requests.RequestException:
      pass  # DeepL failed (network, quota, etc.) — fall through to MyMemory.
  return _translate_mymemory(text, source_lang, target_lang)

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
  unique_lines = list(dict.fromkeys(lines))
  translation_cache = {}

  # Fast path: batch all unique lines through DeepL in a few requests.
  api_key = os.environ.get("DEEPL_API_KEY")
  if api_key and source_language in DEEPL_SUPPORTED and target_language in DEEPL_SUPPORTED:
    try:
      for start in range(0, len(unique_lines), 50):
        chunk = unique_lines[start:start + 50]
        results = _translate_deepl_batch(chunk, source_language, target_language, api_key)
        for line, translated in zip(chunk, results):
          translation_cache[line] = translated or "Translation unavailable"
    except requests.RequestException:
      translation_cache = {}  # DeepL failed entirely — fall back per line below.

  # Fallback (or DeepL misses): translate any remaining lines. Run them through
  # a small thread pool so a full song finishes in seconds instead of ~1s/line.
  remaining = [line for line in unique_lines if line not in translation_cache]

  def _translate_one(line):
    try:
      translated = translate_text(
        line,
        source_lang=source_language,
        target_lang=target_language,
      )
    except requests.RequestException:
      translated = None
    return line, translated or "Translation unavailable"

  if remaining:
    workers = min(_MYMEMORY_WORKERS, len(remaining))
    with ThreadPoolExecutor(max_workers=workers) as pool:
      for line, translated in pool.map(_translate_one, remaining):
        translation_cache[line] = translated

  return [
    {"original": line, "translation": translation_cache[line]}
    for line in lines
  ]


# Only cache translations that are present and actually in the target language.
def is_cacheable_translation(translated_lines, target_language):
  meaningful = [
    item["translation"]
    for item in translated_lines
    if item["translation"] != "Translation unavailable"
    and item["translation"] != item["original"]
  ]
  if not meaningful:
    return False

  # Reject results that came back in the wrong language; stay lenient if unsure.
  detected = detect_language(" ".join(meaningful))
  if detected and detected != target_language.split("-")[0]:
    return False
  return True


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

  # Only cache real translations that actually came back in the target language.
  if not is_cacheable_translation(translated_lines, target_language):
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