import { Link, useLocation } from "react-router-dom";
import WordSaveModal from "../components/WordSaveModal";
import NowPlaying from "../components/NowPlaying";
import { mockLyrics } from "../data/mockLyrics";
import { getLyrics, getMe, getPreviewUrl, getToken, getTranslation, getWordTranslation, saveWord as saveWordToBackend, startPlayback } from "../services/api";
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
  const hasLoadedRef = useRef(false);
  const playerRef = useRef(null);
  const deviceIdRef = useRef(null);
  const hasStartedRef = useRef(false);
  const playerInitRef = useRef(false);
  const lyricsListRef = useRef(null);
  const activeLineRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [lineTimes, setLineTimes] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [selectedWordTranslation, setSelectedWordTranslation] = useState('');
  const [loopLine, setLoopLine] = useState(false);
  const [loopIndex, setLoopIndex] = useState(null);

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
        const fraction = match[3] ? parseFloat(`0.${match[3]}`) : 0;

        return { time: minutes * 60 + seconds + fraction, text: cleanLyricLine(line) };
      })
      .filter((item) => item && item.text && !shouldSkipLine(item.text))
      .map((item) => item.time);
  }

  // Loads original lyrics and translated lyrics when page opens, validates and catches any errors
  useEffect(() => {
    // Guards against React StrictMode running this effect twice in development
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

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

        // Detect the user's Spotify plan so playback can auto-pick preview vs full song
        try {
          const me = await getMe();
          setIsPremium(me.product === "premium");
        } catch (meErr) {
          console.error(meErr);
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

  // Jumps playback to a line's start when the full song is playing (so nav/loop stay in sync)
  function seekToLine(index) {
    if (isPremium && lineTimes[index] != null) {
      handleSeek(lineTimes[index]);
    }
  }

  // Goes to previous lyric line
  function goToPreviousLine() {
    if (activeLineIndex > 0) {
      const index = activeLineIndex - 1;
      setActiveLineIndex(index);
      // Move the loop target too so looping follows the line the user picked
      if (loopLine) setLoopIndex(index);
      seekToLine(index);
    }
  }

  // Goes to next lyric line
  function goToNextLine() {
    if (activeLineIndex < lyrics.length - 1) {
      const index = activeLineIndex + 1;
      setActiveLineIndex(index);
      if (loopLine) setLoopIndex(index);
      seekToLine(index);
    }
  }

  // Toggles looping; locks onto the current line so the loop target can't drift
  function toggleLoop() {
    const next = !loopLine;
    setLoopLine(next);
    if (next) {
      setLoopIndex(activeLineIndex);
      seekToLine(activeLineIndex);
    } else {
      setLoopIndex(null);
    }
  }

  // Highlights the lyric line whose timestamp matches the current playback position
  useEffect(() => {
    // While looping we keep the active line fixed so it can't ping-pong with the next line
    if (lineTimes.length === 0 || loopLine) return;

    let index = 0;
    for (let i = 0; i < lineTimes.length; i++) {
      if (lineTimes[i] <= positionSec) {
        index = i;
      } else {
        break;
      }
    }
    setActiveLineIndex((prev) => (prev === index ? prev : index));
  }, [positionSec, lineTimes, loopLine]);

  // Loops the locked line for shadowing: seek back to its start once playback reaches the end
  useEffect(() => {
    if (!loopLine || !isPremium || lineTimes.length === 0 || loopIndex == null) return;

    const start = lineTimes[loopIndex];
    const end =
      loopIndex + 1 < lineTimes.length
        ? lineTimes[loopIndex + 1]
        : durationSec || start + 8;

    if (positionSec >= end - 0.15 || positionSec < start - 0.5) {
      handleSeek(start);
    }
  }, [positionSec, loopLine, isPremium, loopIndex, lineTimes, durationSec]);

  // Smoothly keeps the active lyric centered in the list, like Apple Music
  useEffect(() => {
    const container = lyricsListRef.current;
    const activeLine = activeLineRef.current;
    if (!container || !activeLine) return;

    const containerRect = container.getBoundingClientRect();
    const lineRect = activeLine.getBoundingClientRect();
    const offsetWithin = lineRect.top - containerRect.top + container.scrollTop;
    const top = offsetWithin - container.clientHeight / 2 + lineRect.height / 2;

    container.scrollTo({ top, behavior: "smooth" });
  }, [activeLineIndex]);

  // Loads the Spotify Web Playback SDK and creates a player for Premium users
  useEffect(() => {
    if (!isPremium || playerInitRef.current) return;
    playerInitRef.current = true;

    function initPlayer() {
      const player = new window.Spotify.Player({
        name: "Linguify Player",
        getOAuthToken: (cb) => {
          getToken().then(cb).catch((err) => console.error(err));
        },
        volume: 0.8,
      });

      player.addListener("ready", ({ device_id }) => {
        deviceIdRef.current = device_id;
        setPlayerReady(true);
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setPositionSec(state.position / 1000);
        setDurationSec(state.duration / 1000);
      });

      player.connect();
      playerRef.current = player;
    }

    if (window.Spotify) {
      initPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [isPremium]);

  // Keeps the position advancing smoothly while the full song plays (SDK only emits on changes)
  useEffect(() => {
    if (!isPremium || !isPlaying) return;

    const intervalId = setInterval(async () => {
      const player = playerRef.current;
      if (!player) return;
      const state = await player.getCurrentState();
      if (state) {
        setPositionSec(state.position / 1000);
        setDurationSec(state.duration / 1000);
      }
    }, 250);

    return () => clearInterval(intervalId);
  }, [isPremium, isPlaying]);

  // Plays/pauses the 30s preview clip for free users
  function togglePreview() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  // Plays/pauses the active source: full song (Premium) or 30s preview (free)
  async function togglePlayback() {
    if (!isPremium) {
      togglePreview();
      return;
    }

    const player = playerRef.current;
    if (!player) return;

    // First press starts the track on our device; later presses just toggle play/pause
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      try {
        await startPlayback(deviceIdRef.current, selectedSong.id);
      } catch (err) {
        console.error(err);
        hasStartedRef.current = false;
      }
    } else {
      player.togglePlay();
    }
  }

  // Seeks the active source to a given time in seconds
  function handleSeek(seconds) {
    if (isPremium) {
      if (playerRef.current) {
        playerRef.current.seek(Math.floor(seconds * 1000));
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
    setPositionSec(seconds);
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

      {/* Free/open users get the 30s preview; Premium users get the full song via the SDK */}
      <NowPlaying
        coverUrl={selectedSong.coverUrl || selectedSong.albumArt}
        title={selectedSong.title}
        artist={selectedSong.artist}
        isPlaying={isPlaying}
        positionSec={positionSec}
        durationSec={durationSec}
        onToggle={togglePlayback}
        onSeek={handleSeek}
        disabled={isPremium ? !playerReady || !selectedSong.id : !previewUrl}
        note={
          isPremium
            ? playerReady
              ? "Full song"
              : "Connecting to Spotify..."
            : "30-second preview"
        }
      />

      {/* Shadowing tool: loop the active line (full song / Premium only) */}
      {isPremium && lineTimes.length > 0 && (
        <>
          <div className="practice-controls">
            <button
              className={loopLine ? "practice-button practice-active" : "practice-button"}
              onClick={toggleLoop}
            >
              {loopLine ? "Looping line ↻" : "Loop line"}
            </button>
          </div>

          <p className="practice-hint">
            Loop replays the current line over and over for shadowing practice.
          </p>
        </>
      )}

      {!isPremium && previewUrl && (
        <audio
          ref={audioRef}
          src={previewUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => setDurationSec(e.currentTarget.duration)}
          onTimeUpdate={(e) => setPositionSec(e.currentTarget.currentTime)}
        />
      )}

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
        <div className="lyrics-list" ref={lyricsListRef}>
          {lyrics.map((line, index) => (
            <div
              key={line.id}
              ref={index === activeLineIndex ? activeLineRef : null}
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
