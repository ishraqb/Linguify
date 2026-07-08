import { Link } from 'react-router-dom'

function LyricsPlayer() {
  return (
    <div className="page">
      <div className="top-row">
        <Link to="/language-selection" className="secondary-button">
          ← Back
        </Link>

        <div className="song-title-box">
          <h1>Song Title - Artists</h1>
          <p>Choose playback mode</p>
        </div>

      <div className="step-box">Step 3/4</div>
    </div>

    <div className="playback-options">
      <button className="secondary-button">
        Preview Free
        <span>30 sec preview clip</span>
      </button>

      <button className="secondary-button">
        Full Song Premium
        <span>Play full song with synced lyrics</span>
      </button>
    </div>

    <div className="Song Duration Bar"></div>

    <div className="lyrics-layout">
      <div className="lyrics-list">
        <div className="lyric-line">
          <p>Translated lyrics</p>
          <span>Original lyrics</span>
        </div>

        <div className="lyric-line active-lyric">
          <p>Translated lyrics</p>
          <span>Original lyrics</span>
        </div>

        <div className="lyric-line">
          <p>Translated lyrics</p>
          <span>Original lyrics</span>
        </div>

        <div className="lyric-line">
          <p>Translated lyrics</p>
          <span>Original lyrics</span>
        </div>
      </div>

      <div className="word-panel">
        <h3>Tap a word to learn </h3>

        <button className="word-button">Word</button>
        <button className="word-button">Word</button>
        <button className="word-button">Word</button>
        <button className="word-button">Word</button>
        <button className="word-button">Word</button>
        <button className="word-button">Word</button>
      </div>
    </div>

    <div className="lesson-controls">
      <button className="secondary-button">Previous Line</button>
      <p>Tap a word to learn and save it</p>
      <Link to="/lesson-complete" className="secondary-button">
        Next Line
      </Link>
    </div>
  </div>
  )
}

export default LyricsPlayer