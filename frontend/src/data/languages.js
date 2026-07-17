/**
 * Shared list of languages the app can translate lyrics into.
 * Labels and native names are derived from Intl.DisplayNames so we don't
 * hand-maintain 25+ names; each entry is built once at module load.
 */

// Curated set of well-supported MyMemory target languages (ISO 639-1 codes).
const TARGET_LANGUAGE_CODES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'uk', 'pl',
  'tr', 'ar', 'hi', 'zh', 'ja', 'ko', 'vi', 'th', 'id', 'sv',
  'el', 'he', 'ro', 'cs', 'fa',
]

// Codes surfaced as one-tap quick picks at the top of the picker.
export const POPULAR_CODES = ['en', 'es', 'fr', 'de', 'ja', 'ko']

// English name of a language code (e.g. "de" -> "German"); falls back to the code.
function languageLabel(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || code
  } catch {
    return code
  }
}

// The language's name in its own language (e.g. "es" -> "Español").
function nativeLanguageName(code) {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code)
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : null
  } catch {
    return null
  }
}

// Build a full language object once so components can just read the fields.
function buildLanguage(code) {
  const label = languageLabel(code)
  const native = nativeLanguageName(code)
  return {
    code,
    label,
    // Only keep a distinct native name; skip it when it matches the English label.
    native: native && native !== label ? native : null,
  }
}

export const TARGET_LANGUAGES = TARGET_LANGUAGE_CODES.map(buildLanguage)

export const POPULAR_LANGUAGES = POPULAR_CODES.map(
  (code) => TARGET_LANGUAGES.find((language) => language.code === code) || buildLanguage(code)
)

// Look up a single language object by code (used to resolve auto-detected codes).
export function findLanguage(code) {
  if (!code) return null
  return TARGET_LANGUAGES.find((language) => language.code === code) || buildLanguage(code)
}
