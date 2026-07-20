import random
import re
from wordfreq import zipf_frequency

_WORD_RE = re.compile(r"[^\W\d_]+", re.UNICODE)

# A good word to blank out isn't a tiny stopword and isn't an ultra-rare token.
MIN_ZIPF = 2.5
MAX_ZIPF = 5.5
MIN_WORD_LENGTH = 3


# Pick words from a line that make reasonable fill-in-the-blank targets.
def _candidate_words(text, language):
  candidates = []
  for word in _WORD_RE.findall(text):
    if len(word) < MIN_WORD_LENGTH:
      continue
    if MIN_ZIPF <= zipf_frequency(word.lower(), language) <= MAX_ZIPF:
      candidates.append(word)
  return candidates


# Replace the first whole-word occurrence of a word in a line with a blank.
def _blank_line(line, word):
  pattern = re.compile(rf"\b{re.escape(word)}\b")
  return pattern.sub("____", line, count=1)


# Build fill-in-the-blank questions from a song's lyrics (multiple choice).
def generate_cloze_questions(lyrics, language="en", count=5, rng=None):
  rng = rng or random
  lines = [line.strip() for line in lyrics.splitlines() if line.strip()]

  # Pool of every candidate word in the song, used to make wrong-answer options.
  pool = []
  for line in lines:
    pool.extend(_candidate_words(line, language))
  unique_pool = list(dict.fromkeys(pool))

  questions = []
  for line in lines:
    if len(questions) >= count:
      break
    candidates = _candidate_words(line, language)
    if not candidates:
      continue

    answer = rng.choice(candidates)
    distractors = [word for word in unique_pool if word.lower() != answer.lower()]
    rng.shuffle(distractors)

    options = distractors[:3] + [answer]
    rng.shuffle(options)

    questions.append({
      "prompt": _blank_line(line, answer),
      "answer": answer,
      "options": options,
      # Full line kept so the quiz can show the answer in context as an explanation.
      "line": line,
    })
  return questions
