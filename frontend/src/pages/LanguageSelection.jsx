import { Link } from 'react-router-dom'

function LanguageSelection() {
  return (
    <div className="page">
      <Link to="/search" className="back-link">
        ← Back
      </Link>

      <h1 className="page-title">Choose Translation Language</h1>

      <div className="song-card">
        <h3>Sample Song</h3>
        <p>Sample Artist</p>
      </div>

      <div className="language-grid">
        <button className="language-button">English</button>
        <button className="language-button">Spanish</button>
        <button className="language-button">French</button>
        <button className="language-button">Korean</button>
        <button className="language-button">Japanese</button>
        <button className="language-button">Other</button>
      </div>

      <Link to="/lyrics" className="main-button">
        Start Lesson
      </Link>
    </div>
  )
}

export default LanguageSelection