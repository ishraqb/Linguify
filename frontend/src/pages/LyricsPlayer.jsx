import { useState } from "react";
import { Link } from "react-router-dom";
import WordSaveModal from "../components/WordSaveModal"

function LyricsPlayer() {
  const lyrics = [
    {
      original: "Que me quiero ir contigo",
      translation: "That I want to go with you",
      words: ["Que", "me", "quiero", "ir", "contigo"],
    },
    {
      original: "Y perderme en la ciudad",
      translation: "And get lost in the city",
      words: ["Y", "perderme", "en", "la", "ciudad"],
    },
    {
      original: "Bajo luces y estrellas",
      translation: "Under lights and stars",
      words: ["Bajo", "luces", "y", "estrellas"],
    },
  ];

  const [activeLineIndex, setActiveLineIndex] = useState(0)
  const [selectedWord, setSelectedWord] = useState(null)

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
    setSelectedWord(null)
  }

  return (
    <div className="page">
      <div className="top-row">
        <Link to="/language-selection" className="secondary-button">
          ← Back
        </Link>

        <div className="song-title-box">
          <h1>Song Title - Artists</h1>
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

      <div className="lyrics-layout">
        <div className="lyrics-list">
          {lyrics.map((line, index) => (
            <div
              key={index}
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
          <h3>Tap a word to learn </h3>

          {lyrics[activeLineIndex].words.map((word, index) => (
            <button 
              key={index}
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
  );
}

export default LyricsPlayer;
