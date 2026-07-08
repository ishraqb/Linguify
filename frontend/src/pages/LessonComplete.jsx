import { Link } from 'react-router-dom'

function LessonComplete() {
  return (
    <div className="page">
      <h1 className="page-title">Lesson Complete!</h1>
      <p className="page-text">You finished your song lesson</p>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>12</h3>
          <p>Lines Reviewed</p>
        </div>

        <div className="stat-card">
          <h3>5</h3>
          <p>Words Saved</p>
        </div>

        <div className="stat-card">
          <h3>English</h3>
          <p>Target Language</p>
        </div>
      </div>

      <h2 className="section-title">New Words Learned</h2>

      <div className="word-card">
        <h3>contigo</h3>
        <p>with you</p>
      </div>

      <div className="button-row">
        <Link to="/my-words" className="main-button">
          Review Saved Words
        </Link>

        <Link to="/search" className="secondary-button">
          Choose New Song
        </Link>
      </div>
    </div>
  )
}

export default LessonComplete