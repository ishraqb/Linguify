import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="page">
      <div className="landing-header">
        <div className="brand-box">
          <div className="logo-box">Icon</div>
          <h1>Linguify</h1>
        </div>

        <a href="#how-it-works" className="secondary-button">
          About
        </a>
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

      <section id="how-it-works" className="info-card">
        <h2>How it works</h2>
        <p>
          Log in with Spotify, choose a song, select a translation language,
          follow the lyrics line by line, and save new vocabulary words for review.
        </p>
      </section>

      <Link to="/dashboard" className="main-button wide-button">
        Login with Spotify
      </Link>
    </div>
  )
}

export default Landing