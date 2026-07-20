"""Fetch a real-world example sentence for a word from Tatoeba.

Tatoeba is a free, keyless corpus of sentences with human translations. We use
it to show learners the word used in a natural sentence (separate from the song
lyric). Kept fully best-effort: any network/parse failure just returns None so
saving words and building quizzes never break.
"""

import requests
from concurrent.futures import ThreadPoolExecutor
from services.lemma_service import base_form

_TATOEBA_URL = "https://tatoeba.org/en/api_v0/search"

# Tatoeba uses ISO 639-3 codes; map from our ISO 639-1 app codes (common set).
_ISO3 = {
  "en": "eng", "es": "spa", "fr": "fra", "de": "deu", "it": "ita",
  "pt": "por", "nl": "nld", "ru": "rus", "uk": "ukr", "pl": "pol",
  "tr": "tur", "ar": "ara", "hi": "hin", "zh": "cmn", "ja": "jpn",
  "ko": "kor", "vi": "vie", "th": "tha", "id": "ind", "sv": "swe",
  "el": "ell", "he": "heb", "ro": "ron", "cs": "ces", "fa": "pes",
}

# In-memory cache so repeated lookups (flashcards, quiz) skip the network.
_cache = {}

# Prefer concise sentences; very long ones make poor flashcard examples.
_MAX_SENTENCE_CHARS = 90


def _iso3(code):
  return _ISO3.get((code or "").split("-")[0].strip().lower())


# Pull the shortest usable sentence + its target translation from a Tatoeba search.
def _search(query, from3, to3):
  response = requests.get(
    _TATOEBA_URL,
    params={"from": from3, "to": to3, "query": query, "sort": "relevance"},
    timeout=6,
  )
  response.raise_for_status()
  results = response.json().get("results") or []

  best = None
  for result in results:
    text = (result.get("text") or "").strip()
    if not text or len(text) > _MAX_SENTENCE_CHARS:
      continue
    translation = _first_translation(result, to3)
    if not translation:
      continue
    if best is None or len(text) < len(best["text"]):
      best = {"text": text, "translation": translation}
  return best


# Find this sentence's translation in the requested language (nested list shape).
def _first_translation(result, to3):
  for group in result.get("translations") or []:
    for item in group:
      if item.get("lang") == to3 and item.get("text"):
        return item["text"].strip()
  return None


# Return {"text", "translation"} for a natural sentence using the word, or None.
def example_sentence(word, source_language, target_language):
  if not word:
    return None
  from3 = _iso3(source_language)
  to3 = _iso3(target_language)
  if not from3 or not to3 or from3 == to3:
    return None

  key = (word.strip().lower(), from3, to3)
  if key in _cache:
    return _cache[key]

  result = None
  # Try the word as written, then its base form (conjugations often miss).
  queries = [word]
  lemma = base_form(word, source_language)
  if lemma:
    queries.append(lemma)

  for query in queries:
    try:
      result = _search(query, from3, to3)
    except requests.RequestException:
      result = None
    if result:
      break

  _cache[key] = result
  return result


# Fetch example sentences for many words at once (used to keep the quiz snappy).
def example_sentences_bulk(words, source_language, target_language):
  if not words:
    return {}
  with ThreadPoolExecutor(max_workers=min(5, len(words))) as pool:
    results = pool.map(
      lambda w: (w, example_sentence(w, source_language, target_language)),
      words,
    )
    return {word: example for word, example in results}
