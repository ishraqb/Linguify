import { Link } from 'react-router-dom'

function MyWords() {
  return (
    <div className="page">
      <div className="top-nav">
        <h1>Linguify</h1>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/search">Search</Link>
          <Link to="/my-words">My Words</Link>
        </div>
      </div>

      <h2 className="page-title">My Words</h2>
      <p className="page-text">
        Review the vocabulary words you saved from songs
      </p>

      <button className="main-button">Start Flashcard Review</button>

      <div className="word-card">
        <h3>contigo</h3>
        <p>Translation: with you</p>
        <p>From: Sample Song</p>
      </div>

      <div className="word-card">
        <h3>corazón</h3>
        <p>Translation: heart</p>
        <p>From: Sample Song</p>
      </div>

      <Link to="/dashboard" className="secondary-button">
        Back to Dashboard
      </Link>
    </div>
  )
}

export default MyWords