import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { detectLanguage, getDifficulty, getPreview } from '../services/api'
import LanguagePicker from '../components/LanguagePicker'
import Icon from '../components/Icon'
import { TARGET_LANGUAGES, findLanguage } from '../data/languages'

/**
 * Page for choosing the song's source language and the target translation language (language to learn)
 * Passes the selected song and language choices to LyricsPlayer
 */
function LanguageSelection() {
  const location = useLocation()

  const selectedSong = location.state?.song

  const [sourceLanguage, setSourceLanguage] = useState(null)
  const [targetLanguage, setTargetLanguage] = useState(null)
  const [detecting, setDetecting] = useState(true)
  const [autoDetected, setAutoDetected] = useState(false)
  const [difficulty, setDifficulty] = useState(null)
  const [showSourceOverride, setShowSourceOverride] = useState(false)
  const [coverUrl, setCoverUrl] = useState(selectedSong?.coverUrl || null)

  // Auto-detect the song's language from its lyrics; only fall back to a manual picker if it fails
  useEffect(() => {
    if (!selectedSong) return
    let active = true
    detectLanguage(selectedSong.title, selectedSong.artist)
      .then((code) => {
        if (!active) return
        if (code) {
          // Use whatever language was detected, resolving it to a labeled entry.
          setSourceLanguage(findLanguage(code))
          setAutoDetected(true)
        } else {
          // Detection came back empty, so let the user pick the language.
          setShowSourceOverride(true)
        }
      })
      .catch(() => {
        if (active) setShowSourceOverride(true)
      })
      .finally(() => {
        if (active) setDetecting(false)
      })
    return () => {
      active = false
    }
  }, [selectedSong])

  // Pull album art from Deezer when the catalog song is missing a cover.
  useEffect(() => {
    if (!selectedSong || selectedSong.coverUrl) return
    let active = true
    getPreview(selectedSong.title, selectedSong.artist)
      .then((media) => {
        if (active && media.coverUrl) setCoverUrl(media.coverUrl)
      })
      .catch(() => {})
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

  // Manual source options come from the shared curated list; surface a
  // detected language that isn't in the list at the front so it's selectable.
  const sourceLanguages =
    sourceLanguage && !TARGET_LANGUAGES.some((language) => language.code === sourceLanguage.code)
      ? [sourceLanguage, ...TARGET_LANGUAGES]
      : TARGET_LANGUAGES

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

        <div className="step-bar">
          <div className="step-bar-fill" style={{ width: '50%' }} />
        </div>

        <div className="step-box">Step 2/4</div>
      </div>

      <h2 className="section-title center-text">You chose</h2>

      <div className="selected-song-box">
        <div className="song-cover">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`${selectedSong.title} cover`}
              className="song-cover-img"
            />
          ) : (
            <div className="song-cover-fallback">
              <Icon name="music" size={28} strokeWidth={1.6} />
            </div>
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

      {detecting ? (
        <p className="page-text center-text detected-language-text">
          Detecting the song's language…
        </p>
      ) : sourceLanguage ? (
        <p className="page-text center-text detected-language-text">
          This song is in <strong>{sourceLanguage.label}</strong>
          {autoDetected ? ' (auto-detected)' : ''}
          {' · '}
          <button
            type="button"
            className="link-button"
            onClick={() => setShowSourceOverride((value) => !value)}
          >
            {showSourceOverride ? 'Hide' : 'Not right?'}
          </button>
        </p>
      ) : (
        <p className="page-text center-text detected-language-text">
          We couldn't detect the language — pick it below.
        </p>
      )}

      {(showSourceOverride || (!detecting && !sourceLanguage)) && (
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
                setShowSourceOverride(false)
              }}
            >
              {language.label}
            </button>
          ))}
        </div>
      )}

      <h2 className="section-title center-text">
        Translate the lyrics into
      </h2>

      <LanguagePicker
        value={targetLanguage?.code}
        onChange={setTargetLanguage}
        exclude={sourceLanguage?.code}
      />

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