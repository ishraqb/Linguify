import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getCloze } from '../services/api'

/**
 * Fill-in-the-blank (cloze) quiz built from the song's lyrics
 * Shows one lyric line at a time with a missing word and multiple-choice options
 */
function Quiz() {
  const location = useLocation()

  const song = location.state?.song
  const songId = location.state?.songId
  const sourceLanguage = location.state?.sourceLanguage
  const targetLanguage = location.state?.targetLanguage
  const savedWords = location.state?.savedWords || []
  const linesReviewed = location.state?.linesReviewed || 0

  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  // Load quiz questions for the song once the page opens
  useEffect(() => {
    if (!songId) {
      return
    }
    let active = true
    getCloze(songId, sourceLanguage?.code)
      .then((data) => {
        if (!active) return
        setQuestions(data || [])
      })
      .catch(() => {
        if (active) setError('Could not build a quiz for this song')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [songId])

  // Records the picked option and scores it (only the first pick counts)
  function handleSelect(option) {
    if (selected) return
    setSelected(option)
    if (option === questions[currentIndex].answer) {
      setScore((prev) => prev + 1)
    }
  }

  // Moves to the next question or ends the quiz
  function handleNext() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1)
      setSelected(null)
    } else {
      setFinished(true)
    }
  }

  const completeState = {
    song,
    sourceLanguage,
    targetLanguage,
    savedWords,
    linesReviewed,
    quizScore: score,
    quizTotal: questions.length,
  }

  // Guard against opening the quiz directly without a song
  if (!songId) {
    return (
      <div className="page">
        <h2 className="section-title center-text">No song to quiz on</h2>
        <p className="page-text center-text">
          Start a lesson first, then take the quiz.
        </p>
        <Link to="/search" className="main-button wide-button">
          Choose a song
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page">
        <p className="page-text center-text">Building your quiz…</p>
      </div>
    )
  }

  if (error || questions.length === 0) {
    return (
      <div className="page">
        <h2 className="section-title center-text">Quiz unavailable</h2>
        <p className="page-text center-text">
          {error || 'There were not enough words in this song to make a quiz.'}
        </p>
        <Link to="/lesson-complete" state={completeState} className="main-button wide-button">
          Continue
        </Link>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="page">
        <div className="complete-header">
          <h1>Quiz Complete</h1>
          <p>
            You scored {score} out of {questions.length}
          </p>
        </div>

        <div className="quiz-score-box">
          <span className="quiz-score-value">
            {Math.round((score / questions.length) * 100)}%
          </span>
        </div>

        <Link to="/lesson-complete" state={completeState} className="main-button wide-button">
          Finish
        </Link>
      </div>
    )
  }

  const question = questions[currentIndex]

  return (
    <div className="page">
      <div className="top-row">
        <Link to="/lyrics" state={location.state} className="secondary-button">
          ← Back
        </Link>

        <div className="song-title-box">
          <h1>Fill in the blank</h1>
          <p>
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>

        <div className="step-box">Step 4/4</div>
      </div>

      <div className="quiz-prompt">{question.prompt}</div>

      <div className="quiz-options">
        {question.options.map((option) => {
          let className = 'quiz-option'
          if (selected) {
            if (option === question.answer) {
              className += ' quiz-correct'
            } else if (option === selected) {
              className += ' quiz-wrong'
            }
          }
          return (
            <button
              key={option}
              className={className}
              onClick={() => handleSelect(option)}
              disabled={Boolean(selected)}
            >
              {option}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="quiz-feedback">
          <p>
            {selected === question.answer
              ? 'Correct!'
              : `Answer: ${question.answer}`}
          </p>
          <button className="main-button wide-button" onClick={handleNext}>
            {currentIndex + 1 < questions.length ? 'Next' : 'See results'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Quiz
