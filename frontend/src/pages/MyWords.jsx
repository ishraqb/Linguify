import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import WordCard from '../components/WordCard'
import Flashcard from '../components/Flashcard'
import Navbar from '../components/Navbar'

/**
 * Page for displaying and managing the user's saved words.
 * Supports searching, single/bulk removal, tapping a word to pop up its
 * flashcard, and a full sequential flashcard review.
 */
import { getSavedWords, deleteSavedWord, deleteAllSavedWords } from '../services/api'

function MyWords() {
  const [searchTerm, setSearchTerm] = useState('')
  const [words, setWords] = useState([])
  const [error, setError] = useState('')
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [popupCard, setPopupCard] = useState(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

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
        setError('Could not load saved words')
      }
    }
    loadWords()
  }, [])

  // Deletes a single saved word from the backend and local state
  async function handleDeleteWord(wordId) {
    try {
      setError('')
      await deleteSavedWord(wordId)
      setWords((current) => current.filter((item) => item.id !== wordId))
    } catch (err) {
      console.error(err)
      setError('Could not delete saved word')
    }
  }

  // Removes every saved word after a confirmation
  async function handleRemoveAll() {
    if (words.length === 0) return
    if (!window.confirm('Remove all saved words? This cannot be undone.')) return
    try {
      setError('')
      await deleteAllSavedWords()
      setWords([])
      exitSelect()
    } catch (err) {
      console.error(err)
      setError('Could not remove all words')
    }
  }

  // Removes just the multi-selected words
  async function handleRemoveSelected() {
    if (selectedIds.length === 0) return
    try {
      setError('')
      await Promise.all(selectedIds.map((id) => deleteSavedWord(id)))
      setWords((current) => current.filter((item) => !selectedIds.includes(item.id)))
      exitSelect()
    } catch (err) {
      console.error(err)
      setError('Could not remove selected words')
    }
  }

  // Toggles one word in/out of the multi-select set
  function toggleSelect(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    )
  }

  function exitSelect() {
    setSelectMode(false)
    setSelectedIds([])
  }

  // Filters saved words based on the given search input
  const filteredWords = words.filter((item) =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function startReview() {
    if (words.length === 0) return
    setReviewMode(true)
    setReviewIndex(0)
  }

  function goToNextCard() {
    if (reviewIndex < words.length - 1) setReviewIndex(reviewIndex + 1)
  }

  function goToPreviousCard() {
    if (reviewIndex > 0) setReviewIndex(reviewIndex - 1)
  }

  // Full sequential flashcard review
  if (reviewMode) {
    return (
      <div className="page">
        <Navbar />

        <div className="top-row">
          <button className="secondary-button" onClick={() => setReviewMode(false)}>
            Exit review
          </button>
          <div className="count-pill">
            {reviewIndex + 1} / {words.length}
          </div>
        </div>

        <div className="flashcard-area">
          <Flashcard card={words[reviewIndex]} />

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
          <div className="button-row">
            {selectMode ? (
              <button className="secondary-button" onClick={exitSelect}>
                Cancel
              </button>
            ) : (
              <button
                className="secondary-button"
                onClick={() => setSelectMode(true)}
                disabled={words.length === 0}
              >
                Select
              </button>
            )}
            <button
              className="main-button"
              onClick={startReview}
              disabled={words.length === 0}
            >
              Review ({words.length})
            </button>
          </div>
        </div>
      </div>

      <div className="mywords-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search saved words"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        {selectMode ? (
          <button
            className="danger-button"
            onClick={handleRemoveSelected}
            disabled={selectedIds.length === 0}
          >
            Remove selected ({selectedIds.length})
          </button>
        ) : (
          <button
            className="danger-button"
            onClick={handleRemoveAll}
            disabled={words.length === 0}
          >
            Remove all
          </button>
        )}
      </div>

      {error && <p className="page-text">{error}</p>}

      {filteredWords.map((item) => (
        <WordCard
          key={item.id}
          word={item.word}
          translation={item.translation || item.definition}
          songTitle={item.songTitle}
          dateAdded={item.dateAdded}
          onRemove={() => handleDeleteWord(item.id)}
          onClick={() => setPopupCard(item)}
          selectable={selectMode}
          selected={selectedIds.includes(item.id)}
          onToggleSelect={() => toggleSelect(item.id)}
        />
      ))}

      {filteredWords.length === 0 &&
        (words.length === 0 ? (
          <div className="empty-state">
            <img src="/logo-mark.png" alt="" className="empty-mascot" />
            <h3>No saved words yet</h3>
            <p>Tap words while you study a song to save them here, then review them as flashcards.</p>
            <Link to="/search" className="main-button">Find a song</Link>
          </div>
        ) : (
          <p className="page-text">No words match your search.</p>
        ))}

      {/* Tapping a word pops up its flashcard */}
      {popupCard && (
        <div className="modal-background" onClick={() => setPopupCard(null)}>
          <div className="flashcard-popup" onClick={(event) => event.stopPropagation()}>
            <button
              className="close-button flashcard-popup-close"
              onClick={() => setPopupCard(null)}
              aria-label="Close"
            >
              ×
            </button>
            <Flashcard card={popupCard} />
          </div>
        </div>
      )}
    </div>
  )
}

export default MyWords
