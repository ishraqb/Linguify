import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'

function LessonComplete() {
  const location = useLocation()

  const selectedSong = location.state?.song || {
    title: "Song",
    artist: "Artist",
  }
  const sourceLanguage = location.state?.sourceLanguage || {
    label: "Original",
    code: '',
  }

  const targetLanguage = location.state?.targetLanguage || {
    label: "Translation",
    code: '',
  }

  const savedWords = location.state?.savedWords || []
  const linesReviewed = location.state?.linesReviewed || 0

  return (
    <div className="page">
      <Navbar/>

      <div className="complete-header">
        <h1>Song Finished</h1>
        <p>
          You completed a lesson for {selectedSong.title} by {' '}
          {selectedSong.artist}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Lines Reviewed</h3>
          <p>{linesReviewed}</p>
        </div>

        <div className="stat-card">
          <h3>Words Saved</h3>
          <p>{savedWords.length}</p>
        </div>

        <div className="stat-card">
          <h3>Language</h3>
          <p>
            {sourceLanguage.label} → {targetLanguage.label}
          </p>
        </div>
      </div>

      <div className="new-words-box">
        <h2>New words learned</h2>

        {savedWords.length > 0 ? (
          <>
            <div className="word-row word-row-header">
              <p>Word</p>
              <p>Status</p>
            </div>

            {savedWords.map((word, index) => (
              <div className="word-row" key={`${word}-${index}`}>
                <p>{word}</p>
                <p>Saved to My Words</p>
              </div>
            ))}
          </>
        ) : (
          <p className="page-text">
            No words were saved during this lesson
          </p>
        )}
      </div>

      <div className="button-row">
        <Link to="/dashboard" className="secondary-button">
          Back to Dashboard
        </Link>

        <Link to="/my-words" className="secondary-button">
          Go to My Words
        </Link>

        <Link to="/search" className="secondary-button">
          Start a New Song
        </Link>
      </div>
    </div>
  )
}

export default LessonComplete
