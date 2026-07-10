import { useEffect, useState } from 'react'
import WordCard from '../components/WordCard'
import Navbar from '../components/Navbar'
import { mockWords } from '../data/mockWords'
import { getSavedWords, deleteWord } from '../services/api'

function MyWords() {
  const [searchTerm, setSearchTerm] = useState('')
  const [words, setWords] = useState(mockWords)
  const [error, setError] = useState('')

  const [reviewMode, setReviewMode] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    async function loadWords() {
      try {
        setError('')
        const savedWords = await getSavedWords()

        if (Array.isArray(savedWords) && savedWords.length > 0) {
          setWords(savedWords)
        }
      } catch (err) {
        console.error(err)
        setError("Using demo saved words for now")
      }
    }

    loadWords()
  }, [])

  const filteredWords = words.filter((item) =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleDelete(id) {
    try {
      await deleteWord(id)
      setWords(words.filter((item) => item.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  function startReview() {
    if (words.length === 0) return
    setReviewMode(true)
    setReviewIndex(0)
    setShowAnswer(false)
  }

  function exitReview() {
    setReviewMode(false)
    setShowAnswer(false)
  }

  function goToNextCard() {
    if (reviewIndex < words.length - 1) {
      setReviewIndex(reviewIndex + 1)
      setShowAnswer(false)
    }
  }

  function goToPreviousCard() {
    if (reviewIndex > 0) {
      setReviewIndex(reviewIndex - 1)
      setShowAnswer(false)
    }
  }

  if (reviewMode) {
    const card = words[reviewIndex]

    return (
      <div className="page">
        <Navbar />

        <div className="top-row">
          <button className="secondary-button" onClick={exitReview}>
            Exit review
          </button>
          <div className="step-box">
            {reviewIndex + 1} / {words.length}
          </div>
        </div>

        <div className="flashcard-area">
          <div className="flashcard" onClick={() => setShowAnswer(!showAnswer)}>
            {showAnswer ? (
              <div>
                <h2>{card.definition || card.translation}</h2>
                {card.songTitle && (
                  <p className="page-text">from {card.songTitle}</p>
                )}
              </div>
            ) : (
              <h2>{card.word}</h2>
            )}

            <p className="flashcard-hint">
              {showAnswer ? 'Tap to hide' : 'Tap to reveal translation'}
            </p>
          </div>

          <div className="flashcard-controls">
            <button
              className="secondary-button"
              onClick={goToPreviousCard}
              disabled={reviewIndex === 0}
            >
              Previous
            </button>
            <button
              className="main-button"
              onClick={goToNextCard}
              disabled={reviewIndex === words.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Navbar />

      <div className="section-row">
        <h2 className="section-title">My Words</h2>
        <button
          className="main-button"
          onClick={startReview}
          disabled={words.length === 0}
        >
          Review ({words.length})
        </button>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search saved words"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      {error && <p className="page-text">{error}</p>}

      {filteredWords.map((item) =>
        <WordCard
          key={item.id}
          word={item.word}
          definition={item.definition || item.translation}
          songTitle={item.songTitle}
          dateAdded={item.dateAdded}
          onDelete={() => handleDelete(item.id)}
        />
      )}

      {filteredWords.length === 0 && (
        <p className="page-text">No saved words found</p>
      )}
    </div>
  )
}

export default MyWords
