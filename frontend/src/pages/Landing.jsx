import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="page">
      <div className="landing-header">
        <div className="brand-box">
          <div className="logo-box">Icon</div>
          <h1>Linguify</h1>
        </div>

        <button className="secondary-button">About</button>
      </div>

      <div className="landing-content">
        <div className="landing-text">
          <div className="large-box">
            <h2>Learn languages through songs you love</h2>
          </div>

          <div className="small-box">
            <p>
              Pick a song from Spotify, translate the lyrics, save new words,
              and review them with flashcards
            </p>
          </div>
        </div>

        <div className="image-box">Thumbnail / Image</div>
      </div>

      <Link to="/dashboard" className="main-button wide-button">
        Login with Spotify
      </Link>
    </div>
  )
}

export default Landing