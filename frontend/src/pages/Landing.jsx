function Landing() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand">
          <span className="brand-logo">🎵</span>
          <span className="brand-name">Linguify</span>
        </div>
        <a href="#how-it-works" className="ghost-link">How it works</a>
      </header>

      <section className="hero">
        <div className="hero-text">
          <span className="hero-badge">Learn while you listen</span>
          <h1>Learn languages through the songs you love</h1>
          <p>
            Pick a song from Spotify, read the lyrics line-by-line with
            translations, save the words you want to remember, and review
            them as flashcards.
          </p>
          <a href={`${API_BASE_URL}/api/login`} className="spotify-cta">
            Login with Spotify
          </a>
          <p className="hero-note">Free to start. Your Spotify, your music.</p>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="lyric-preview">
            <span className="lyric-preview-label">Now translating</span>
            <div className="lyric-row">
              <p>Je t'aime pour toujours</p>
              <span>I love you forever</span>
            </div>
            <div className="lyric-row muted">
              <p>Sous les lumières de la ville</p>
              <span>Under the city lights</span>
            </div>
            <div className="lyric-chip-row">
              <span className="lyric-chip">toujours</span>
              <span className="lyric-chip">lumières</span>
              <span className="lyric-chip">ville</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-section">
        <h2>How it works</h2>
        <div className="how-grid">
          <div className="how-card">
            <span className="how-icon">🎧</span>
            <h3>Pick a song</h3>
            <p>Search Spotify or use a track you recently played.</p>
          </div>
          <div className="how-card">
            <span className="how-icon">🌍</span>
            <h3>See translations</h3>
            <p>Lyrics appear line-by-line with the meaning underneath.</p>
          </div>
          <div className="how-card">
            <span className="how-icon">🗂️</span>
            <h3>Save &amp; review</h3>
            <p>Tap any word to save it, then study with flashcards.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
