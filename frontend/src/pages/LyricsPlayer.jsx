import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import WordSaveModal from "../components/WordSaveModal";
import { mockLyrics } from "../data/mockLyrics";
import { getLyrics, getTranslation, saveWord as saveWordToBackend } from "../services/api";

function LyricsPlayer() {
  const location = useLocation();

  const selectedSong = location.state?.song || {
    title: "DÁKITI",
    artist: "Bad Bunny, Jhay Cortez",
  };

  const selectedLanguage = location.state?.language || {
    label: "English",
    code: "en",
  };

  const [sondId, setSongId] = useState(null)
  const [lyrics, setLyrics] = useState(mockLyrics);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState(null);
  const [savedWords, setSavedWords] = useState([]);

  function formatTranslatedLyrics(translatedLyrics) {
    return translatedLyrics
      .split("\n")
      .filter((line) => line.trim())
      .map((line, index) => {
        const [original, translation] = line.split(" || ");

        return {
          id: index + 1,
          original: original || "",
          translation: translation || "",
          words: (original || "").split(" ").filter(Boolean),
        };
      });
  }

  useEffect(() => {
    async function loadLyricsAndTranslation() {
      try {
        setIsLoading(true);
        setError("");

        const lyricsData = await getLyrics(selectedSong);
        setSongId(lyricsData.song_id)
        const translationData = await getTranslation(
          lyricsData.song_id,
          selectedLanguage.code,
        );

        const formattedLyrics = formatTranslatedLyrics(
          translationData.translated_lyrics,
        );

        setLyrics(formattedLyrics);
        setActiveLineIndex(0);
      } catch (err) {
        console.error(err);
        setError("Using demo lyrics for now");
        setLyrics(mockLyrics);
      } finally {
        setIsLoading(false);
      }
    }

    loadLyricsAndTranslation();
  }, []);

  function goToPreviousLine() {
    if (activeLineIndex > 0) {
      setActiveLineIndex(activeLineIndex - 1);
    }
  }

  function goToNextLine() {
    if (activeLineIndex < lyrics.length - 1) {
      setActiveLineIndex(activeLineIndex + 1);
    }
  }

  function handleWordClick(word) {
    setSelectedWord(word);
  }

  function closeModal() {
    setSelectedWord(null);
  }

  async function saveWord() {
    if (!selectedWord || savedWords.includes(selectedLanguage)) {
      setSelectedWord(null)
      return
    }

    const activeLine = lyrics[activeLineIndex]

    try {
      await saveWordToBackend({
        song_id: songid,
        word: selectedWord,
        translation: activeLine?.translation || selectedWord,
        target_language: selectedLanguage.code,
        example_sentence: activeLine?.original || '',
        pronunciation: '',
      })
    } catch (err) {
      console.erorr(err)
    }

    setSavedWords([...savedWords, selectedWord])
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
          <p>Translation language: {selectedLanguage.label}</p>
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

      {isLoading && (
        <p className="page-text">Loading lyrics and translations...</p>
      )}

      {error && <p className="page-text">{error}</p>}

      <div className="lyrics-layout">
        <div className="lyrics-list">
          {lyrics.map((line, index) => (
            <div
              key={line.id}
              className={
                index === activeLineIndex
                  ? "lyric-line active-lyric"
                  : "lyric-line"
              }
            >
              <p>{line.translation}</p>
              <span>{line.original}</span>
            </div>
          ))}
        </div>

        <div className="word-panel">
          <h3>Tap a word to learn</h3>

          {(lyrics[activeLineIndex]?.words || []).map((word, index) => (
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
  );
}

export default LyricsPlayer;
