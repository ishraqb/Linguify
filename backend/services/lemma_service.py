"""Reduce a word to its dictionary (base/unconjugated) form.

Uses the lightweight `simplemma` lemmatizer, which supports many languages.
Kept isolated and defensive so a missing model or unsupported language never
breaks word saving or the flashcard view.
"""

try:
  from simplemma import lemmatize as _lemmatize
except Exception:  # pragma: no cover - simplemma is optional at runtime
  _lemmatize = None


# Return the base form of a word (e.g. "enteré" -> "enterar"), or None if it
# can't be determined or matches the original word.
def base_form(word, language):
  if not word or not language or _lemmatize is None:
    return None
  code = language.split("-")[0].strip().lower()
  try:
    lemma = _lemmatize(word.lower(), code)
  except Exception:
    return None
  if not lemma or lemma.lower() == word.lower():
    return None
  return lemma
