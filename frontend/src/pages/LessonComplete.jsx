import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { recordActivity } from '../services/api'

/**
 * Page for displaying the summary after user finishes a song
 * Displays the selected song, artist, lines reviewed, words saved, and source & target language
 * Provides navigation  back to Dashboard, My Words a new Song, or choosing a new song
 */
function LessonComplete() {
  const location = useLocation()

  const selectedSong = location.state?.song || {
    title: "Song",
    artist: "Artist",
  }
  const sourceLanguage = location.state?.sourceLanguage || {
    label: "Original",
    code: '',
  }

  const targetLanguage = location.state?.targetLanguage || {
    label: "Translation",
    code: '',
  }

  const savedWords = location.state?.savedWords || []
  const linesReviewed = location.state?.linesReviewed || 0
  const quizScore = location.state?.quizScore
  const quizTotal = location.state?.quizTotal
  const hasQuizResult = typeof quizScore === 'number' && quizTotal > 0

  // Award XP/streak once for finishing the lesson (and again if a quiz was taken).
  const hasRecordedRef = useRef(false)
  useEffect(() => {
    if (hasRecordedRef.current) return
    hasRecordedRef.current = true

    recordActivity('song').catch(() => {})
    if (hasQuizResult) {
      recordActivity('quiz').catch(() => {})
    }
  }, [hasQuizResult])

  return (
    <div className="page">
      <Navbar/>

      <div className="complete-header">
        <div className="complete-emoji">🎉</div>
        <h1>Song Finished!</h1>
        <p>
          You completed a lesson for <strong>{selectedSong.title}</strong> by {' '}
          {selectedSong.artist}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">📖</span>
          <h3>Lines Reviewed</h3>
          <p>{linesReviewed}</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">⭐</span>
          <h3>Words Saved</h3>
          <p>{savedWords.length}</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">🌍</span>
          <h3>Language</h3>
          <p>
            {sourceLanguage.label} → {targetLanguage.label}
          </p>
        </div>

        {hasQuizResult && (
          <div className="stat-card">
            <span className="stat-icon">🎯</span>
            <h3>Quiz Score</h3>
            <p>
              {quizScore}/{quizTotal}
            </p>
          </div>
        )}
      </div>

      <div className="new-words-box">
        <h2>New words learned</h2>

        {savedWords.length > 0 ? (
          <>
            <div className="word-row word-row-header">
              <p>Word</p>
              <p>Status</p>
            </div>

            {savedWords.map((word, index) => (
              <div className="word-row" key={`${word}-${index}`}>
                <p>{word}</p>
                <p>Saved to My Words</p>
              </div>
            ))}
          </>
        ) : (
          <p className="page-text">
            No words were saved during this lesson
          </p>
        )}
      </div>

      <div className="button-row">
        <Link to="/dashboard" className="secondary-button">
          Back to Dashboard
        </Link>

        <Link to="/my-words" className="secondary-button">
          Go to My Words
        </Link>

        <Link to="/search" className="secondary-button">
          Start a New Song
        </Link>
      </div>
    </div>
  )
}

export default LessonComplete
