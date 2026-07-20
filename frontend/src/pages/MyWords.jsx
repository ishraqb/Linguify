import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import WordCard from '../components/WordCard'
import Navbar from '../components/Navbar'
import Icon from '../components/Icon'
import { getSavedWords, deleteSavedWord } from '../services/api'

// Speaks a word aloud using the browser's built-in speech synthesis (no backend needed).
function speakWord(text, languageCode) {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  if (languageCode) utterance.lang = languageCode
  utterance.rate = 0.9
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

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
    const meaning = card.translation || card.definition

    return (
      <div className="page">
        <Navbar />

        <div className="top-row">
          <button className="secondary-button" onClick={exitReview}>
            Exit review
          </button>
          <div className="count-pill">
            {reviewIndex + 1} / {words.length}
          </div>
        </div>

        <div className="flashcard-area">
          <div
            className={showAnswer ? 'flashcard-flip flipped' : 'flashcard-flip'}
            onClick={() => setShowAnswer(!showAnswer)}
          >
            <div className="flashcard-inner">
              {/* Front: the word + pronunciation */}
              <div className="flashcard-face flashcard-front">
                <span className="flashcard-eyebrow">Word</span>
                <h2>{card.word}</h2>
                <button
                  className="pronounce-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    speakWord(card.word, card.sourceLanguage)
                  }}
                  aria-label={`Pronounce ${card.word}`}
                >
                  <Icon name="volume" size={20} /> Pronounce
                </button>
                <p className="flashcard-hint">Tap card to flip</p>
              </div>

              {/* Back: meaning, base form, example, source song */}
              <div className="flashcard-face flashcard-back">
                <span className="flashcard-eyebrow">Meaning</span>
                <h2>{meaning}</h2>

                {card.baseForm && (
                  <p className="flashcard-detail">
                    <span className="flashcard-detail-label">Base form</span> {card.baseForm}
                  </p>
                )}

                {card.exampleSentence && (
                  <p className="flashcard-example">“{card.exampleSentence}”</p>
                )}

                {card.songTitle && (
                  <p className="flashcard-source">from {card.songTitle}</p>
                )}

                <p className="flashcard-hint">Tap card to flip back</p>
              </div>
            </div>
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

      <div className="page-header">
        <span className="hero-badge">Your vocabulary</span>
        <div className="section-row">
          <h1 className="page-title">My Words</h1>
          <button
            className="main-button"
            onClick={startReview}
            disabled={words.length === 0}
          >
            Review ({words.length})
          </button>
        </div>
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
        words.length === 0 ? (
          <div className="empty-state">
            <img src="/logo-mark.png" alt="" className="empty-mascot" />
            <h3>No saved words yet</h3>
            <p>Tap words while you study a song to save them here, then review them as flashcards.</p>
            <Link to="/search" className="main-button">Find a song</Link>
          </div>
        ) : (
          <p className="page-text">No words match your search.</p>
        )
      )}
    </div>
  )
}

export default MyWords
