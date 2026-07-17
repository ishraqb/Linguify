import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { detectLanguage, getDifficulty } from '../services/api'

// Turns a language code (e.g. "de") into a readable name (e.g. "German")
function languageLabel(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || code
  } catch {
    return code
  }
}

/**
 * Page for choosing the song's source language and the target translation language (language to learn)
 * Passes the selected song and language choices to LyricsPlayer
 */
function LanguageSelection() {
  const location = useLocation()
  const languages = [
    {label: 'English', code: 'en'},
    {label: 'Spanish', code: 'es'},
    {label: 'French', code: 'fr'},
    {label: 'Korean', code: 'ko'},
    {label: 'Japanese', code: 'ja'},
  ]

  const selectedSong = location.state?.song

  const [sourceLanguage, setSourceLanguage] = useState(null)
  const [targetLanguage, setTargetLanguage] = useState(null)
  const [detecting, setDetecting] = useState(true)
  const [autoDetected, setAutoDetected] = useState(false)
  const [difficulty, setDifficulty] = useState(null)

  // Auto-detect the song's language from its lyrics and pre-select it (user can still override)
  useEffect(() => {
    if (!selectedSong) return
    let active = true
    detectLanguage(selectedSong.title, selectedSong.artist)
      .then((code) => {
        if (!active || !code) return
        // Use whatever language was detected, even if it's not one of the quick options.
        const match = languages.find((language) => language.code === code)
        setSourceLanguage(match || { code, label: languageLabel(code) })
        setAutoDetected(true)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setDetecting(false)
      })
    return () => {
      active = false
    }
  }, [selectedSong])

  // Fetch a difficulty rating so the learner knows if the song fits their level
  useEffect(() => {
    if (!selectedSong) return
    let active = true
    getDifficulty(selectedSong.title, selectedSong.artist)
      .then((result) => {
        if (active && result) setDifficulty(result)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [selectedSong])

  // Show the detected language as a button too, even if it isn't one of the quick options
  const sourceLanguages =
    sourceLanguage && !languages.some((language) => language.code === sourceLanguage.code)
      ? [sourceLanguage, ...languages]
      : languages

  // If someone accesses "/language-selection" with choosing a song it throws an error
  // Prevents page from crashing
  if (!selectedSong) {
    return (
      <div className="page">
        <div className="top-row">
          <Link to="/search" className="secondary-button">
            Back
          </Link>

          <div className="step-box">Step 2/4</div>
        </div>

        <h2 className="section-title center-text">No song selected</h2>

        <p className="page-text center-text">
          Go back and choose a song before you start a lesson!
        </p>

        <Link to="/search" className="main-button wide-button">
          Choose a song
        </Link>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="top-row">
        <Link to="/search" className="secondary-button">
          Back
        </Link>

        <div className="step-bar">Step progress bar 2/4</div>

        <div className="step-box">Step 2/4</div>
      </div>

      <h2 className="section-title center-text">You chose</h2>

      <div className="selected-song-box">
        <div className="song-cover">
          {selectedSong.coverUrl ? (
            <img
              src={selectedSong.coverUrl}
              alt={`${selectedSong.title} cover`}
              className="song-cover-img"
            />
          ) : (
            'Album/Song Cover Photo'
          )}
        </div>
          
        <div>
          <h3>{selectedSong.title}</h3>
          <p>{selectedSong.artist}</p>
          {difficulty && (
            <span
              className={`difficulty-badge difficulty-${difficulty.level.toLowerCase()}`}
            >
              {difficulty.level}
            </span>
          )}
        </div>
      </div>

      <h2 className="section-title center-text">
        What language is this song in?
      </h2>

      {detecting && (
        <p className="page-text center-text">Detecting language…</p>
      )}

      <div className="language-grid">
        {sourceLanguages.map((language) => (
          <button
            key={`source-${language.code}`}
            className={
              sourceLanguage?.code === language.code
                ? 'language-button selected-language'
                : 'language-button'
            }
            onClick={() => {
              setSourceLanguage(language)
              setAutoDetected(false)
            }}
          >
            {language.label}
          </button>
        ))}
      </div>

      {sourceLanguage && (
        <p className="selected-text">
          Selected language: {sourceLanguage.label}
          {autoDetected ? ' (auto-detected)' : ''}
        </p>
      )}

      <h2 className="section-title center-text">
        Translate into
      </h2>

      <div className="language-grid">
        {languages.map((language) => (
          <button
            key={`target-${language.code}`}
            className={
              targetLanguage?.code === language.code
                ? 'language-button selected-language'
                : 'language-button'
            }
            onClick={() => setTargetLanguage(language)}
          >
            {language.label}
          </button>
        ))}
      </div>

      {targetLanguage && (
        <p className="selected-text">
          Translation language: {targetLanguage.label}
        </p>
      )}

      {sourceLanguage && targetLanguage ? (
        <Link
          to="/lyrics"
          state={{
            song: selectedSong,
            sourceLanguage,
            targetLanguage,
          }}
          className="main-button wide-button"
        >
          Start Lesson
        </Link>
      ) : (
        <button className="main-button wide-button disabled-button" disabled>
          Choose both languages first
        </button>
      )}
      
    </div>
  )
}

export default LanguageSelection