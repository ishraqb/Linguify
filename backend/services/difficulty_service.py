import re
from wordfreq import zipf_frequency, available_languages

# Matches word-like tokens (letters only) across scripts, ignoring digits/punctuation.
_WORD_RE = re.compile(r"[^\W\d_]+", re.UNICODE)

# Zipf frequency below this counts as a "rare" word a learner likely won't know.
# (Zipf is ~7 for the most common words and ~1-2 for uncommon ones; 0 means unknown.)
RARE_ZIPF = 3.0


def _tokenize(text):
  return _WORD_RE.findall(text.lower())


# Rate how hard a song's lyrics are from the share of rare/unknown words (0-100, higher = harder).
def compute_difficulty(lyrics, language="en"):
  # wordfreq only has data for a fixed set of languages; skip scoring otherwise.
  if language not in available_languages():
    return None

  words = _tokenize(lyrics)
  if not words:
    return None

  # Share of rare words discriminates songs far better than the raw average,
  # which tends to bunch most lyrics together around common filler words.
  rare_count = sum(1 for word in words if zipf_frequency(word, language) < RARE_ZIPF)
  rare_ratio = rare_count / len(words)

  if rare_ratio < 0.15:
    level = "Beginner"
  elif rare_ratio < 0.30:
    level = "Intermediate"
  else:
    level = "Advanced"

  return {
    "level": level,
    "score": round(rare_ratio * 100),
    "rare_word_ratio": round(rare_ratio, 2),
  }
