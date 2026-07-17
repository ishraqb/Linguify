"""Transliterate non-Latin lyrics into a readable Latin (romanized) form.

Uses dedicated libraries for the trickiest scripts (pinyin for Chinese, Hepburn
for Japanese) and Unidecode as a broad fallback for everything else.
"""

from unidecode import unidecode

# Languages written in non-Latin scripts that benefit from romanization.
_NON_LATIN = {
  "ja", "zh", "ko", "ru", "uk", "bg", "sr", "el",
  "ar", "fa", "he", "hi", "th",
}


# True if the language is normally written in a non-Latin script.
def needs_romanization(language):
  return _base_code(language) in _NON_LATIN


# Normalize a language tag like "zh-CN" down to its base code.
def _base_code(language):
  return (language or "").split("-")[0].strip().lower()


# Romanize a single line of text based on its language.
def romanize_line(text, language=None):
  if not text or not text.strip():
    return ""

  code = _base_code(language)
  if code == "zh":
    return _romanize_chinese(text)
  if code == "ja":
    return _romanize_japanese(text)
  return unidecode(text).strip()


# Romanize each line, preserving line order so it aligns with the displayed lyrics.
def romanize_lines(lines, language=None):
  return [romanize_line(line, language) for line in lines]


# Chinese characters -> toned pinyin.
def _romanize_chinese(text):
  try:
    from pypinyin import pinyin, Style
    return " ".join(word[0] for word in pinyin(text, style=Style.TONE)).strip()
  except Exception:
    return unidecode(text).strip()


# Japanese kana/kanji -> Hepburn romaji.
def _romanize_japanese(text):
  try:
    import pykakasi
    converter = pykakasi.kakasi()
    return " ".join(item["hepburn"] for item in converter.convert(text)).strip()
  except Exception:
    return unidecode(text).strip()
