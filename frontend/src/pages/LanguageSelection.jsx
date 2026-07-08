import { useState } from 'react'
import { Link } from 'react-router-dom'

function LanguageSelection() {
  const languages = ['English', 'Spanish', 'French', 'Korean', 'Japanese', 'Other']

  const selectedSong = {
    title: 'DÁKITI',
    artist: 'Bad Bunny, Jhay Cortez',
    coverUrl: '',
  }

  const [selectedLanguage, setSelectedLanguage] = useState('')

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
            key={language}
            className={
              selectedLanguage === language
                ? 'language-button selected-language'
                : 'language-button'
            }
            onClick={() => setSelectedLanguage(language)}
          >
            {language}
          </button>
        ))}
      </div>

      {selectedLanguage && (
        <p className="selected-text">
          Selected language: {selectedLanguage}
        </p>
      )}

      {selectedLanguage ? (
        <Link to="/lyrics" className="main-button wide-button">
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