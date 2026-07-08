import { Link } from 'react-router-dom'
import Navbar from "../components/Navbar"

function LessonComplete() {
  return (
    <div className="page">
      <Navbar/>

      <div className="complete-header">
        <h1>Song Finished</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Lines Reviewed</h3>
          <p># of lines</p>
        </div>

        <div className="stat-card">
          <h3>Words Saved</h3>
          <p># of words</p>
        </div>

        <div className="stat-card">
          <h3>Language</h3>
          <h3>translated language</h3>
        </div>
      </div>

      <div className="new-words-box">
        <h2>New words learned</h2>

        <div className="word-row">
          <p>Word</p>
          <p>Translated word</p>
          <p>Brief Definition</p>
        </div>

        <div className="word-row">
          <p>Word</p>
          <p>Translated word</p>
          <p>Brief Definition</p>
        </div>

        <div className="word-row">
          <p>Word</p>
          <p>Translated word</p>
          <p>Brief Definition</p>
        </div>
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