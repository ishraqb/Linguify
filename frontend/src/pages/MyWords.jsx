import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import WordCard from '../components/WordCard'
import Flashcard from '../components/Flashcard'
import Navbar from '../components/Navbar'
import { findLanguage } from '../data/languages'
import { getSavedWords, deleteSavedWord, deleteAllSavedWords, reviewWord } from '../services/api'

/**
 * Page for displaying and managing the user's saved words.
 * Supports searching, single/bulk removal, tapping a word to pop up its
 * flashcard, and a Know / Still learning review session.
 */
function MyWords() {
  const [searchTerm, setSearchTerm] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')
  const [words, setWords] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewDeck, setReviewDeck] = useState([])
  const [reviewIndex, setReviewIndex] = useState(0)
  const [reviewKnown, setReviewKnown] = useState(0)
  const [reviewLearning, setReviewLearning] = useState(0)
  const [reviewDone, setReviewDone] = useState(false)
  const [popupCard, setPopupCard] = useState(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

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
      } finally {
        setLoading(false)
      }
    }
    loadWords()
  }, [])

  useEffect(() => {
    if (!popupCard) return
    function onKey(event) {
      if (event.key === 'Escape') setPopupCard(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [popupCard])

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

  function toggleSelect(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    )
  }

  function exitSelect() {
    setSelectMode(false)
    setSelectedIds([])
  }

  const languages = Array.from(
    new Set(words.map((item) => item.targetLanguage).filter(Boolean))
  )

  const filteredWords = words.filter((item) => {
    const matchesSearch = item.word.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLanguage = !languageFilter || item.targetLanguage === languageFilter
    return matchesSearch && matchesLanguage
  })

  const dueCount = words.filter((item) => item.dueForReview !== false).length

  function startReview() {
    if (words.length === 0) return
    const due = words.filter((item) => item.dueForReview !== false)
    const deck = due.length > 0 ? due : words
    setReviewDeck(deck)
    setReviewIndex(0)
    setReviewKnown(0)
    setReviewLearning(0)
    setReviewDone(false)
    setReviewMode(true)
  }

  async function markReview(correct) {
    const card = reviewDeck[reviewIndex]
    if (!card) return
    try {
      const updated = await reviewWord(card.id, correct)
      setWords((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
    } catch {
      // Still advance the session if the network blip happens.
    }
    if (correct) setReviewKnown((count) => count + 1)
    else setReviewLearning((count) => count + 1)

    if (reviewIndex < reviewDeck.length - 1) {
      setReviewIndex(reviewIndex + 1)
    } else {
      setReviewDone(true)
    }
  }

  if (reviewMode) {
    if (reviewDone) {
      return (
        <div className="page">
          <Navbar />
          <div className="complete-header">
            <h1>Review complete</h1>
            <p>
              {reviewKnown} known · {reviewLearning} still learning
            </p>
          </div>
          <div className="button-row">
            <button className="secondary-button" onClick={() => setReviewMode(false)}>
              Back to My Words
            </button>
            <button className="main-button" onClick={startReview} disabled={words.length === 0}>
              Review again
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="page">
        <Navbar />

        <div className="top-row">
          <button className="secondary-button" onClick={() => setReviewMode(false)}>
            Exit review
          </button>
          <div className="count-pill">
            {reviewIndex + 1} / {reviewDeck.length}
          </div>
        </div>

        <div className="flashcard-area">
          <Flashcard card={reviewDeck[reviewIndex]} />

          <div className="flashcard-controls review-grade">
            <button className="danger-button" onClick={() => markReview(false)}>
              Still learning
            </button>
            <button className="main-button" onClick={() => markReview(true)}>
              I know this
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
              Review ({dueCount || words.length})
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

      {languages.length > 1 && (
        <div className="filter-group">
          <span className="filter-label">Language</span>
          <div className="filter-pills">
            <button
              className={!languageFilter ? 'filter-pill filter-pill-active' : 'filter-pill'}
              onClick={() => setLanguageFilter('')}
            >
              All
            </button>
            {languages.map((code) => (
              <button
                key={code}
                className={languageFilter === code ? 'filter-pill filter-pill-active' : 'filter-pill'}
                onClick={() => setLanguageFilter(code)}
              >
                {findLanguage(code)?.label || code}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="page-text">{error}</p>}
      {loading && <p className="page-text">Loading your words…</p>}

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

      {!loading && filteredWords.length === 0 &&
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

      {popupCard && (
        <div className="modal-background" onClick={() => setPopupCard(null)}>
          <div
            className="flashcard-popup"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
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
