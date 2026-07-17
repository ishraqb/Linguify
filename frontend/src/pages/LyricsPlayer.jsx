import { Link, useLocation } from "react-router-dom";
import WordSaveModal from "../components/WordSaveModal";
import { mockLyrics } from "../data/mockLyrics";
import { getLyrics, getPreviewUrl, getTranslation, getWordTranslation, saveWord as saveWordToBackend } from "../services/api";
import { useEffect, useRef, useState } from "react";

/**
 * Main lesson page for displaying the lyrics of the song, in the selected source & target language
 * Lets users move through the lyrics lines, tap words from bank for more information, and save words to My Words
 */
function LyricsPlayer() {
  const location = useLocation();

  const selectedSong = location.state?.song || {
    title: "DÁKITI",
    artist: "Bad Bunny, Jhay Cortez",
  };

  const sourceLanguage = location.state?.sourceLanguage || {
    label: "Spanish",
    code: "es",
  }

  const targetLanguage = location.state?.targetLanguage || {
    label: "English",
    code: "en",
  };

  const [songId, setSongId] = useState(null)
  const [lyrics, setLyrics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState(null);
  const [savedWords, setSavedWords] = useState([]);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [lineTimes, setLineTimes] = useState([]);
  const [selectedWordTranslation, setSelectedWordTranslation] = useState('');

  // Removes time stamp markers from the retrieved synced lyric lines
  function cleanLyricLine(line) {
    return line
      .replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '')
      .trim()
  }

  // Skips lines if they contain anything that is not part of the actual lyrics
  function shouldSkipLine(line) {
    const lowerLine = line.toLowerCase()

    return (
      !line ||
      lowerLine.includes('lyrics by') ||
      lowerLine.includes('letra de') ||
      lowerLine.includes('composed by') ||
      lowerLine.includes('compuesto por') ||
      lowerLine.includes('produced by') ||
      lowerLine.includes('producido por')
    )
  }

  // Converts backend translated lyrics text into line objects to be used for rendering
  function formatTranslatedLyrics(translatedLyrics) {
    return translatedLyrics
      .split("\n")
      .filter((line) => line.trim())
      .map((line, index) => {
        const [originalRaw, translationRaw] = line.split(" || ");

        const original = cleanLyricLine(originalRaw || '')
        const translation = cleanLyricLine(translationRaw || '')

        return {
          id: index + 1,
          original: original || "",
          translation: translation || "",
          words: (original || "").split(" ").filter(Boolean),
        }
      })
      .filter((line) => !shouldSkipLine(line.original))
  }

  // Parses timestamps from synced lyrics into seconds, aligned to the displayed lines
  function parseSyncedTimes(syncedLyrics){
    if (!syncedLyrics) return [];

    return syncedLyrics
      .split("\n")
      .map((line) => {
        const match = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/);
        if (!match) return null;

        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const fraction = match[3] ? parseFloat('0.${match[3]}') : 0;

        return { time: minutes * 60 + seconds + fraction, text: cleanLyricLine(line) };
      })
      .filter((item) => item && item.text && !shouldSkipLine(item.text))
      .map((item) => item.time);
  }

  // Loads original lyrics and translated lyrics when page opens, validates and catches any errors
  useEffect(() => {
    async function loadLyricsAndTranslation() {
      try {
        setIsLoading(true);
        setError("");

        const lyricsData = await getLyrics(selectedSong);
        setSongId(lyricsData.song_id)
        const translationData = await getTranslation(
          lyricsData.song_id,
          sourceLanguage.code,
          targetLanguage.code
        );

        const formattedLyrics = formatTranslatedLyrics(
          translationData.translated_lyrics,
        );

        setLyrics(formattedLyrics);
        setLineTimes(parseSyncedTimes(lyricsData.synced_lyrics));
        setActiveLineIndex(0);

        try{
          const preview = await getPreviewUrl(selectedSong.title, selectedSong.artist);
          setPreviewUrl(preview);
        } catch (previewErr) {
          console.error(previewErr);
        }
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

  // Goes to previous lyric line
  function goToPreviousLine() {
    if (activeLineIndex > 0) {
      setActiveLineIndex(activeLineIndex - 1);
    }
  }

  // Goes to next lyric line
  function goToNextLine() {
    if (activeLineIndex < lyrics.length - 1) {
      setActiveLineIndex(activeLineIndex + 1);
    }
  }

  // Toggles audio playblock for the preview clip (implementing)
  function togglePreview() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  //Highlights the lyric line matching the audio's current playback time
  function handleTimeUpdate(){
    const audio = audioRef.current;
    if (!audio || lineTimes.length === 0) return;

    const currentTime = audio.currentTime;
    let index = 0;
    for (let i = 0; i < lineTimes.length; i++){
      if (linesTimes[i] <= currentTime) {
        index = i;
      } else {
        break;
      }
    }
    setActiveLineIndex((prev) => (prev === index ? prev : index));
  }

  // Loads the WordSaveModal when a word gets clicked
  async function handleWordClick(word) {
    setSelectedWord(word);
    setSelectedWordTranslation('Loading...')

    try {
      const data = await getWordTranslation(
        word,
        sourceLanguage.code,
        targetLanguage.code
      )

      setSelectedWordTranslation(data.translation || 'Translation unavailable')
    } catch (err) {
      console.error(err)
      setSelectedWordTranslation('Translation unavailable')
    }
  }

  // Closes the WordSaveModal
  function closeModal() {
    setSelectedWord(null);
    setSelectedWordTranslation('')
  }

  // Saves the selected word to the backend vocabulary list
  async function saveWord() {
    if (!selectedWord || savedWords.includes(selectedWord)) {
      setSelectedWord(null)
      return
    }

    const activeLine = lyrics[activeLineIndex]
    const wordTranslation = 
      selectedWordTranslation &&
      selectedWordTranslation !== 'Loading...' &&
      selectedWordTranslation !== 'Translation unavailable'
        ? selectedWordTranslation
        : selectedWord

    try {
      await saveWordToBackend({
        song_id: songId,
        word: selectedWord,
        translation: wordTranslation,
        target_language: targetLanguage.code,
        example_sentence: activeLine?.original || '',
        pronunciation: '',
      })
    } catch (err) {
      console.error(err)
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
          <p>
            {sourceLanguage.label} → {targetLanguage.label}
          </p>
        </div>

        <div className="step-box">Step 3/4</div>
      </div>

        <div className="playback-options">
        <button
          className="secondary-button"
          onClick={togglePreview}
          disabled={!previewUrl}
        >
          {isPlaying ? "Pause Preview" : "Preview Free"}
          <span>
            {previewUrl ? "30 sec preview clip" : "No preview available"}
          </span>
        </button>

        <button className="secondary-button">
          Full Song Premium
          <span>Play full song with synced lyrics</span>
        </button>
      </div>

      {previewUrl && (
        <audio
          ref={audioRef}
          src={previewUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
        />
      )}

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

      {!isLoading && lyrics.length === 0 && (
        <p className="page-text">No lyrics loaded yet</p>
      )}

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
              <p>{line.translation || 'Translation unavailable'}</p>
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
        <Link 
          to="/lesson-complete" 
          state={{
            song: selectedSong,
            sourceLanguage,
            targetLanguage,
            savedWords,
            linesReviewed: lyrics.length,
          }}
          className="main-button"
        >
          Finish Lesson
        </Link>
      </div>

      {selectedWord && (
        <WordSaveModal
          word={selectedWord}
          wordTranslation={selectedWordTranslation}
          lyricLine={lyrics[activeLineIndex]?.original}
          translation={lyrics[activeLineIndex]?.translation}
          onClose={closeModal}
          onSave={saveWord}
        />
      )}
    </div>
  );
}

export default LyricsPlayer;
