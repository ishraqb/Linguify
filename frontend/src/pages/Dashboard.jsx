import { Link } from 'react-router-dom'

function Dashboard() {
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

      <h2 className="page-title">Welcome Back</h2>
      <p className="page-text">Start a new song lesson or review your saved words</p>

      <Link to="/search" className="main-button">
        Begin New Song Lesson
      </Link>

      <h3 className="section-title">Recently Played</h3>

      <div className="song-card">
        <h3>Sample Song</h3>
        <p>Sample Artist</p>
        <Link to="/language-select" className="secondary-button">
          Start Lesson
        </Link>
      </div>

      <h3 className="section-title">Recent Words</h3>

      <div className="word-card">
        <h3>contigo</h3>
        <p>with you</p>
      </div>
    </div>
  )
}

export default Dashboard