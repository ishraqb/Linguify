import { useEffect, useState } from 'react'
import WordCard from '../components/WordCard'
import Navbar from '../components/Navbar'
import { getSavedWords, deleteSavedWord } from '../services/api'

/** 
 * Page for displaying and managing the user's saved words
 * Allows for searching, removing saved words, and reviewing words in flashcard mode
 */
function MyWords() {
  const [searchTerm, setSearchTerm] = useState('')
  const [words, setWords] = useState([])
  const [error, setError] = useState('')
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  
  // Deletes a saved word from the backend and removes it from the local state
  async function handleDeleteWord(wordId) {
    try {
      setError('')
      await deleteSavedWord(wordId)

      setWords((currentWords) =>
        currentWords.filter((item) => item.id !== wordId)
    )
    } catch (err) {
      console.error(err)
      setError("Could not delete saved word")
    }
  }

  // Load user's saved words from the backend when the page opens
  useEffect(() => {
    async function loadWords() {
      try {
        setError('')
        const savedWords = await getSavedWords()

        if (Array.isArray(savedWords)) {
          setWords(savedWords)
        }
      } catch (err) {
        console.error(err)
        setError("Could not load saved words")
      }
    }

    loadWords()
  }, [])

  // Filters saved words based on the given search input
  const filteredWords = words.filter((item) =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Starts a flashcard review from the first saved word
  function startReview() {
    if (words.length === 0) return
    setReviewMode(true)
    setReviewIndex(0)
    setShowAnswer(false)
  }

  // Exists the flashcard review mode
  function exitReview() {
    setReviewMode(false)
    setShowAnswer(false)
  }

  // Goes to the next card in flashcard review
  function goToNextCard() {
    if (reviewIndex < words.length - 1) {
      setReviewIndex(reviewIndex + 1)
      setShowAnswer(false)
    }
  }

  // Goes to prevous card in flashcard review
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
                <h2>{card.translation || card.definition}</h2>
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
          translation={item.translation || item.definition}
          songTitle={item.songTitle}
          dateAdded={item.dateAdded}
          onRemove={() => handleDeleteWord(item.id)}
        />
      )}

      {filteredWords.length === 0 && (
        <p className="page-text">No saved words found</p>
      )}
    </div>
  )
}

export default MyWords
