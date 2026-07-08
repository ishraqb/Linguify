import { Link } from 'react-router-dom'
import { useState } from 'react'

function LanguageSelection() {
  const languages = ['English', 'Spanish', 'French', 'Korean', 'Japanese', 'Other']
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
        <div className="song-cover">Album/Song Cover Photo</div>

        <div>
          <h3>Song Title</h3>
          <p>Artist</p>
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