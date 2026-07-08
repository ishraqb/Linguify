import { useState } from 'react'
import { Link } from 'react-router-dom'
import WordSaveModal from '../components/WordSaveModal'
import { mockLyrics } from '../data/mockLyrics'

function LyricsPlayer() {
  const selectedSong = {
    title: 'DÁKITI',
    artist: 'Bad Bunny, Jhay Cortez',
  }

  const lyrics = mockLyrics

  const [activeLineIndex, setActiveLineIndex] = useState(0)
  const [selectedWord, setSelectedWord] = useState(null)
  const [savedWords, setSavedWords] = useState([])

  function goToPreviousLine() {
    if (activeLineIndex > 0) {
      setActiveLineIndex(activeLineIndex - 1)
    }
  }

  function goToNextLine() {
    if (activeLineIndex < lyrics.length - 1) {
      setActiveLineIndex(activeLineIndex + 1)
    }
  }

  function handleWordClick(word) {
    setSelectedWord(word)
  }

  function closeModal() {
    setSelectedWord(null)
  }

  function saveWord() {
    if (selectedWord && !savedWords.includes(selectedWord)) {
      setSavedWords([...savedWords, selectedWord])
    }

    setSelectedWord(null)
  }

  return (
    <div className="page">
      <div className="top-row">
        <Link to="/language-selection" className="secondary-button">
          ← Back
        </Link>

        <div className="song-title-box">
          <h1>
            {selectedSong.title} - {selectedSong.artist}
          </h1>
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

      <div className="song-duration-bar">Song Duration Bar</div>

      <div className="saved-count-box">
        Words saved this lesson: {savedWords.length}
      </div>

      {savedWords.length > 0 && (
        <div className="saved-words-preview">
          {savedWords.map((word) => (
            <span key={word} className="saved-word-pill">
              {word}
            </span>
          ))}
        </div>
      )}

      <div className="lyrics-layout">
        <div className="lyrics-list">
          {lyrics.map((line, index) => (
            <div
              key={line.id}
              className={
                index === activeLineIndex
                  ? 'lyric-line active-lyric'
                  : 'lyric-line'
              }
            >
              <p>{line.translation}</p>
              <span>{line.original}</span>
            </div>
          ))}
        </div>

        <div className="word-panel">
          <h3>Tap a word to learn</h3>

          {lyrics[activeLineIndex].words.map((word, index) => (
            <button
              key={`${word}-${index}`}
              className="word-button"
              onClick={() => handleWordClick(word)}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      <div className="lesson-controls">
        <button className="secondary-button" onClick={goToPreviousLine}>
          Previous Line
        </button>

        <p>Tap a word to learn and save it</p>

        <button className="secondary-button" onClick={goToNextLine}>
          Next Line
        </button>
      </div>

      <div className="button-row">
        <Link to="/lesson-complete" className="main-button">
          Finish Lesson
        </Link>
      </div>

      {selectedWord && (
        <WordSaveModal
          word={selectedWord}
          onClose={closeModal}
          onSave={saveWord}
        />
      )}
    </div>
  )
}

export default LyricsPlayer