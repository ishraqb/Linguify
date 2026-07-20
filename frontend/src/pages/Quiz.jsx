import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getCloze } from '../services/api'
import Icon from '../components/Icon'

/**
 * Fill-in-the-blank (cloze) quiz built from the song's lyrics.
 * Shows one lyric line at a time with a missing word and multiple-choice options,
 * explains each answer, and lets the learner review every question at the end.
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
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)
  const [showReview, setShowReview] = useState(false)

  // Load quiz questions for the song once the page opens
  useEffect(() => {
    if (!songId) {
      return
    }
    let active = true
    getCloze(songId, sourceLanguage?.code, targetLanguage?.code)
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

  const score = answers.filter((a, i) => a === questions[i]?.answer).length

  // Records the picked option (only the first pick per question counts)
  function handleSelect(option) {
    if (selected) return
    setSelected(option)
    setAnswers((prev) => {
      const next = [...prev]
      next[currentIndex] = option
      return next
    })
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
    const percent = Math.round((score / questions.length) * 100)
    return (
      <div className="page">
        <div className="complete-header">
          <div className="complete-emoji"><Icon name="target" size={40} strokeWidth={1.6} /></div>
          <h1>Quiz Complete</h1>
          <p>You scored {score} out of {questions.length}</p>
        </div>

        <div className="quiz-result-row">
          <div className="quiz-score-box">
            <span className="quiz-score-value">{percent}%</span>
            <span className="quiz-score-label">{score}/{questions.length} correct</span>
          </div>
        </div>

        <div className="button-row quiz-result-actions">
          <button
            className="secondary-button"
            onClick={() => setShowReview((prev) => !prev)}
          >
            {showReview ? 'Hide review' : 'Review answers'}
          </button>
          <Link to="/lesson-complete" state={completeState} className="main-button">
            Finish
          </Link>
        </div>

        {showReview && (
          <div className="quiz-review">
            {questions.map((q, i) => {
              const picked = answers[i]
              const correct = picked === q.answer
              return (
                <div
                  key={i}
                  className={correct ? 'review-card review-correct' : 'review-card review-wrong'}
                >
                  <div className="review-head">
                    <span className="review-badge">
                      <Icon name={correct ? 'check' : 'target'} size={14} />
                      {correct ? 'Correct' : 'Incorrect'}
                    </span>
                    <span className="review-number">Q{i + 1}</span>
                  </div>

                  <p className="review-prompt">{q.prompt}</p>

                  <div className="review-answers">
                    {!correct && (
                      <p className="review-line">
                        Your answer: <strong>{picked || '—'}</strong>
                      </p>
                    )}
                    <p className="review-line">
                      Answer: <strong>{q.answer}</strong>
                      {q.meaning ? <span className="review-meaning"> — {q.meaning}</span> : null}
                    </p>
                    {q.line && <p className="review-context">“{q.line}”</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const question = questions[currentIndex]
  const progress = Math.round(((currentIndex + (selected ? 1 : 0)) / questions.length) * 100)

  return (
    <div className="page quiz-page">
      <div className="top-row">
        <Link to="/lyrics" state={location.state} className="secondary-button">
          ← Back
        </Link>

        <div className="song-title-box">
          <h1>Fill in the blank</h1>
          <p>Question {currentIndex + 1} of {questions.length}</p>
        </div>

        <div className="count-pill">{currentIndex + 1}/{questions.length}</div>
      </div>

      <div className="quiz-progress">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="quiz-card">
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
          <div
            className={
              selected === question.answer
                ? 'quiz-explanation explanation-correct'
                : 'quiz-explanation explanation-wrong'
            }
          >
            <div className="explanation-head">
              <Icon name={selected === question.answer ? 'check' : 'target'} size={18} />
              <span>{selected === question.answer ? 'Correct!' : 'Not quite'}</span>
            </div>
            <p className="explanation-answer">
              <strong>{question.answer}</strong>
              {question.meaning ? <span className="explanation-meaning"> — {question.meaning}</span> : null}
            </p>
            {question.line && <p className="explanation-context">“{question.line}”</p>}
            <button className="main-button wide-button" onClick={handleNext}>
              {currentIndex + 1 < questions.length ? 'Next question' : 'See results'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Quiz
