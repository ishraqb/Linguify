import { Link } from 'react-router-dom'

function LyricsPlayer() {
  return (
    <div className="lyrics-page">
      <div className="lyrics-header">
        <Link to="/language-selection" className="back-link">
          ← Back
        </Link>

        <div>
          <h1>Sample Song</h1>
          <p>Sample Artist</p>
        </div>
      </div>

      <div className="playback-box">
        <button className="secondary-button">Preview Free</button>
        <button className="main-button">Full Song Premium</button>
      </div>

      <div className="progress-bar-box">
        <div className="progress-bar-fill"></div>
      </div>

      <div className="lyrics-box">
        <div className="lyric-line dim-line">
          <p>Dimmed lyric line above</p>
          <span>Translated lyric line above</span>
        </div>

        <div className="lyric-line active-line">
          <p>Highlighted active lyric line</p>
          <span>Translated active lyric line</span>
        </div>

        <div className="lyric-line dim-line">
          <p>Dimmed lyric line below</p>
          <span>Translated lyric line below</span>
        </div>
      </div>

      <div className="word-area">
        <p>Tap a word to learn it:</p>
        <button className="word-button">sample</button>
        <button className="word-button">lyric</button>
        <button className="word-button">word</button>
      </div>

      <div className="lesson-controls">
        <button className="secondary-button">Previous Line</button>
        <Link to="/lesson-complete" className="main-button">
          Finish Lesson
        </Link>
        <button className="secondary-button">Next Line</button>
      </div>
    </div>
  )
}

export default LyricsPlayer