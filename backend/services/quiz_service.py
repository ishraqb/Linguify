"""Build a varied quiz from a song: fill-in-the-blank, line translation, and
word meaning multiple-choice questions.

Every question shares the same shape (a prompt, string `options`, and the
correct `answer` string) so the frontend can score and review them uniformly.
"""

import random

from services.cloze_service import generate_cloze_questions, _candidate_words


# Parse a cached "original || translation" block into (original, translation)
# pairs, skipping ad-lib/untranslated lines where the translation just echoes it.
def translation_pairs(translated_lyrics):
  pairs = []
  for line in (translated_lyrics or "").splitlines():
    if "||" not in line:
      continue
    original, _, translation = line.partition("||")
    original = original.strip()
    translation = translation.strip()
    if original and translation and original.lower() != translation.lower():
      pairs.append((original, translation))
  return pairs


# Unique content words across the song, used as word-question candidates.
def candidate_word_pool(lyrics, language, limit=8):
  pool = []
  for line in (lyrics or "").splitlines():
    pool.extend(_candidate_words(line, language))
  return list(dict.fromkeys(pool))[:limit]


# "Choose the correct translation" questions: prompt is a lyric line, the
# options are real line translations (the right one plus other lines as decoys).
def line_questions(pairs, count=3, rng=None):
  rng = rng or random
  usable = [pair for pair in pairs if 2 <= len(pair[0].split()) <= 12]
  all_translations = list(dict.fromkeys(translation for _, translation in pairs))
  rng.shuffle(usable)

  questions = []
  for original, translation in usable:
    if len(questions) >= count:
      break
    distractors = [t for t in all_translations if t.lower() != translation.lower()]
    rng.shuffle(distractors)
    distractors = distractors[:3]
    # Need three plausible decoys for a fair four-option question.
    if len(distractors) < 3:
      continue
    options = distractors + [translation]
    rng.shuffle(options)
    questions.append({
      "type": "line",
      "instruction": "Choose the correct translation",
      "prompt": original,
      "options": options,
      "answer": translation,
      "line": original,
    })
  return questions


# "What does this word mean?" questions: prompt is a word, options are word
# meanings (the right one plus other words' meanings as decoys). `details` maps
# a word to extra learning fields (baseForm/example) merged into its question.
def word_questions(word_meanings, count=2, rng=None, details=None):
  rng = rng or random
  items = [(word, meaning) for word, meaning in word_meanings.items() if meaning]
  all_meanings = list(dict.fromkeys(meaning for _, meaning in items))
  rng.shuffle(items)

  questions = []
  for word, meaning in items:
    if len(questions) >= count:
      break
    distractors = [m for m in all_meanings if m.lower() != meaning.lower()]
    rng.shuffle(distractors)
    distractors = distractors[:3]
    if len(distractors) < 3:
      continue
    options = distractors + [meaning]
    rng.shuffle(options)
    question = {
      "type": "word",
      "instruction": "What does this word mean?",
      "prompt": word,
      "options": options,
      "answer": meaning,
      "meaning": meaning,
    }
    if details and word in details:
      question.update(details[word])
    questions.append(question)
  return questions


# Round-robin interleave several question groups so the quiz feels varied
# rather than all of one type in a row.
def interleave(*groups):
  groups = [group for group in groups if group]
  mixed = []
  position = 0
  while any(position < len(group) for group in groups):
    for group in groups:
      if position < len(group):
        mixed.append(group[position])
    position += 1
  return mixed
