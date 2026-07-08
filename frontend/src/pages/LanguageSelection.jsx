import { Link } from 'react-router-dom'

function LanguageSelection() {
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
        <button className="language-button">English</button>
        <button className="language-button">Spanish</button>
        <button className="language-button">French</button>
        <button className="language-button">Korean</button>
        <button className="language-button">Japanese</button>
        <button className="language-button">Other</button>
      </div>

      <Link to="/lyrics" className="main-button wide-button">
        Start Lesson
      </Link>
    </div>
  )
}

export default LanguageSelection