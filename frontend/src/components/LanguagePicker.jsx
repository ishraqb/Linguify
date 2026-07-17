import { useMemo, useState } from 'react'
import {
  TARGET_LANGUAGES,
  POPULAR_LANGUAGES,
  findLanguage,
} from '../data/languages'

/**
 * Reusable target-language chooser: a row of one-tap quick picks plus a
 * searchable list of the full curated language set.
 *
 * Props:
 *  - value: the currently selected language code (or null)
 *  - onChange: called with the chosen language object { code, label, native }
 *  - exclude: a code to hide (e.g. the song's source language)
 *  - popular: optional override for the quick-pick list
 */
function LanguagePicker({ value, onChange, exclude, popular = POPULAR_LANGUAGES }) {
  const [query, setQuery] = useState('')

  // Hide the excluded language (usually the source language) everywhere.
  const available = useMemo(
    () => TARGET_LANGUAGES.filter((language) => language.code !== exclude),
    [exclude]
  )

  const quickPicks = useMemo(
    () => popular.filter((language) => language.code !== exclude),
    [popular, exclude]
  )

  // Filter the full list by English label or native name as the user types.
  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return available
    return available.filter((language) => {
      const label = language.label.toLowerCase()
      const native = (language.native || '').toLowerCase()
      return label.includes(term) || native.includes(term)
    })
  }, [available, query])

  function handleSelect(language) {
    onChange(language)
  }

  // Show the current selection as a card even if it isn't a quick pick.
  const selected = findLanguage(value)
  const selectedIsQuickPick = quickPicks.some((language) => language.code === value)

  return (
    <div className="language-picker">
      <div className="target-language-grid">
        {quickPicks.map((language) => (
          <button
            key={`quick-${language.code}`}
            type="button"
            className={
              value === language.code ? 'target-card selected-language' : 'target-card'
            }
            onClick={() => handleSelect(language)}
          >
            <span className="target-card-label">{language.label}</span>
            {language.native && (
              <span className="target-card-native">{language.native}</span>
            )}
          </button>
        ))}

        {selected && value && !selectedIsQuickPick && (
          <button
            type="button"
            className="target-card selected-language"
            onClick={() => handleSelect(selected)}
          >
            <span className="target-card-label">{selected.label}</span>
            {selected.native && (
              <span className="target-card-native">{selected.native}</span>
            )}
          </button>
        )}
      </div>

      <input
        className="language-search"
        type="text"
        placeholder="Search 25+ languages…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search languages"
      />

      <ul className="language-results" role="listbox">
        {results.map((language) => (
          <li key={`result-${language.code}`} role="option" aria-selected={value === language.code}>
            <button
              type="button"
              className={
                value === language.code
                  ? 'language-result selected-language'
                  : 'language-result'
              }
              onClick={() => handleSelect(language)}
            >
              <span className="language-result-label">{language.label}</span>
              {language.native && (
                <span className="language-result-native">{language.native}</span>
              )}
            </button>
          </li>
        ))}

        {results.length === 0 && (
          <li className="language-results-empty">No languages match “{query}”</li>
        )}
      </ul>
    </div>
  )
}

export default LanguagePicker
