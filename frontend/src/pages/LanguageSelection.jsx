import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

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

  const [selectedLanguage, setSelectedLanguage] = useState(null)

  if (!selectedSong) {
    return (
      <div className="page">
        <div className="top-row">
          <Link to="/search" className="secondary-button">
            Back
          </Link>

          <div className="step-box">Step 2/4</div>
        </div>

        <h2 className="section-tittle center-text">No song selected</h2>

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
        </div>
      </div>

      <h2 className="section-title center-text">
        Choose translation language
      </h2>

      <div className="language-grid">
        {languages.map((language) => (
          <button
            key={language.code}
            className={
              selectedLanguage === language.code
                ? 'language-button selected-language'
                : 'language-button'
            }
            onClick={() => setSelectedLanguage(language)}
          >
            {language.label}
          </button>
        ))}
      </div>

      {selectedLanguage && (
        <p className="selected-text">
          Selected language: {selectedLanguage.label}
        </p>
      )}

      {selectedLanguage ? (
        <Link 
          to="/lyrics"
          state={{
            song: selectedSong,
            language: selectedLanguage,
          }}
          className="main-button wide-button"
        >
          Start Lesson
        </Link>
      ) : (
        <button className="main-button wide-button disabled-button" disabled>
          Choose a language first
        </button>
      )}
    </div>
  )
}

export default LanguageSelection