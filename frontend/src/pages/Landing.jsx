import { Link } from 'react-router-dom'

function Landing() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

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
            <h2>Learn languages through the songs you love</h2>
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
        <h2>About</h2>
        <p>
          You log in with Spotify, pick a song, and choose a language. Linguify shows the lyrics line-by-line with translations underneath. 
          Tap any word you don’t know to see its translation and hear how it’s pronounced, then save it to a personal flashcard deck to review later
        </p>
      </section>

      <a href={`${API_BASE_URL}/api/login`} className="main-button wide-button">
        Login with Spotify
      </a>
    </div>
  )
}

export default Landing