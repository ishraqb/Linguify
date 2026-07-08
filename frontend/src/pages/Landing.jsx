import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="page">
      <h1 className="page-title">Linguify</h1>

      <p className="page-text">
        Learn languages through songs you already love
      </p>

      <div className="info-card">
        <h2>How it works</h2>
        <p>Pick a song, translate the lyrics, save new words, and review them later</p>
      </div>

      <Link to="/dashboard" className="main-button">
        Login with Spotify
      </Link>
    </div>
  )
}

export default Landing