import re
from wordfreq import zipf_frequency, available_languages

# Matches word-like tokens (letters only) across scripts, ignoring digits/punctuation.
_WORD_RE = re.compile(r"[^\W\d_]+", re.UNICODE)


def _tokenize(text):
  return _WORD_RE.findall(text.lower())


# Score how hard a song's lyrics are from average word frequency (1-100, higher = harder).
def compute_difficulty(lyrics, language="en"):
  # wordfreq only has data for a fixed set of languages; skip scoring otherwise.
  if language not in available_languages():
    return None

  words = _tokenize(lyrics)
  if not words:
    return None

  # Zipf frequency is ~7 for very common words and ~1-2 for rare ones.
  scores = [zipf_frequency(word, language) for word in words]
  average = sum(scores) / len(scores)

  if average >= 4.5:
    level = "Beginner"
  elif average >= 3.8:
    level = "Intermediate"
  else:
    level = "Advanced"

  # Invert the average onto a 0-100 scale so rarer vocabulary reads as harder.
  score = round(max(0, min(100, (7 - average) / 6 * 100)))

  return {"level": level, "score": score, "average_frequency": round(average, 2)}
