import re
from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException

# Seed the detector so language results are deterministic run to run.
DetectorFactory.seed = 0

# Strips LRCLIB-style [mm:ss.xx] timestamps so only lyric text is analyzed.
_TIMESTAMP_RE = re.compile(r"\[\d+:\d+(?:\.\d+)?\]")


# Detect the ISO 639-1 language code of a block of lyrics text.
def detect_language(text):
  if not text or not text.strip():
    return None
  cleaned = _TIMESTAMP_RE.sub("", text)
  try:
    code = detect(cleaned)
  except LangDetectException:
    return None
  # langdetect returns codes like "zh-cn"; keep only the base language part.
  return code.split("-")[0]
