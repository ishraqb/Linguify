import { Link, useLocation } from "react-router-dom";
import WordSaveModal from "../components/WordSaveModal";
import NowPlaying from "../components/NowPlaying";
import { getLyrics, getMe, getPreview, getRomanization, getToken, getTranslation, getWordContext, resolveTrackId, saveWord as saveWordToBackend, startPlayback } from "../services/api";
import { useEffect, useRef, useState } from "react";

// Languages written in non-Latin scripts, where romanization is worth offering.
const NON_LATIN_LANGUAGES = new Set([
  "ja", "zh", "ko", "ru", "uk", "bg", "sr", "el", "ar", "fa", "he", "hi", "th",
]);

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
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const deviceIdRef = useRef(null);
  const hasStartedRef = useRef(false);
  const playerInitRef = useRef(false);
  const lyricsListRef = useRef(null);
  const activeLineRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [coverUrl, setCoverUrl] = useState(selectedSong?.coverUrl || selectedSong?.albumArt || null);
  const [lineTimes, setLineTimes] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [selectedWordTranslation, setSelectedWordTranslation] = useState('');
  const [selectedContext, setSelectedContext] = useState(null);
  const [loopLine, setLoopLine] = useState(false);
  const [loopIndex, setLoopIndex] = useState(null);
  const [romanized, setRomanized] = useState([]);
  const [showRomanization, setShowRomanization] = useState(false);

  // Whether the song's source language uses a non-Latin script.
  const canRomanize = NON_LATIN_LANGUAGES.has((sourceLanguage.code || "").split("-")[0].toLowerCase());

  // YouTube songs (chosen from the YouTube source) play the full track for
  // everyone via the embedded player — no Spotify account or Premium needed.
  const youtubeId = selectedSong.source === "youtube" ? selectedSong.youtubeId : null;
  const youtubeMode = Boolean(youtubeId);

  // Some catalog songs are stored without a Spotify track ID; we resolve one at
  // lesson time (below) so Premium users still get full-song playback.
  const [resolvedTrackId, setResolvedTrackId] = useState(selectedSong.id || null);
  const trackId = selectedSong.id || resolvedTrackId;

  // Full-song playback via the Spotify SDK needs Premium AND a Spotify track ID.
  const fullSong = !youtubeMode && isPremium && Boolean(trackId);

  // Whether we can seek/loop the playback source (full song or YouTube).
  const canSeek = fullSong || youtubeMode;

  // Fetch romanized versions of the displayed lines on first toggle, then show/hide.
  async function toggleRomanization() {
    if (!showRomanization && romanized.length === 0) {
      try {
        const result = await getRomanization(lyrics.map((line) => line.original), sourceLanguage.code);
        setRomanized(result || []);
      } catch (err) {
        console.error(err);
      }
    }
    setShowRomanization((prev) => !prev);
  }

  // Strips leading/trailing punctuation from a tappable word (keeps inner
  // apostrophes/hyphens) so taps and lookups use the clean word, e.g. "Baby," -> "Baby".
  function stripWordPunctuation(word) {
    return word
      .replace(/^[^\p{L}\p{N}]+/u, "")
      .replace(/[^\p{L}\p{N}]+$/u, "");
  }

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
          words: (original || "")
            .split(/\s+/)
            .map(stripWordPunctuation)
            .filter(Boolean),
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
          const media = await getPreview(selectedSong.title, selectedSong.artist);
          setPreviewUrl(media.previewUrl);
          // Fall back to Deezer's album art when the catalog song has no cover.
          if (media.coverUrl && !selectedSong.coverUrl && !selectedSong.albumArt) {
            setCoverUrl(media.coverUrl);
          }
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
        setError("We couldn't find lyrics for this song. Try another one from the Songs page.");
        setLyrics([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadLyricsAndTranslation();
  }, []);

  // If a Premium user opened a song with no Spotify track ID (e.g. from the
  // catalog), look one up by title/artist so playback isn't stuck on the preview.
  useEffect(() => {
    if (youtubeMode || selectedSong.id || resolvedTrackId || !isPremium) return;
    let active = true;
    resolveTrackId(selectedSong.title, selectedSong.artist)
      .then((id) => { if (active && id) setResolvedTrackId(id); })
      .catch(() => {});
    return () => { active = false; };
  }, [isPremium, youtubeMode]);

  // Seeks the active source to a given time in seconds
  function handleSeek(seconds) {
    if (youtubeMode) {
      if (ytPlayerRef.current && ytPlayerRef.current.seekTo) {
        ytPlayerRef.current.seekTo(seconds, true);
      }
    } else if (fullSong) {
      if (playerRef.current) {
        playerRef.current.seek(Math.floor(seconds * 1000));
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
    setPositionSec(seconds);
  }

  // Jumps playback to a line's start when a seekable source is playing (so nav/loop stay in sync)
  function seekToLine(index) {
    if (canSeek && lineTimes[index] != null) {
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

  // Clicking a lyric line makes it active and (for full song) jumps the audio to it
  function handleLineClick(index) {
    setActiveLineIndex(index);
    if (loopLine) setLoopIndex(index);
    seekToLine(index);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveLineIndex((prev) => (prev === index ? prev : index));
  }, [positionSec, lineTimes, loopLine]);

  // Loops the locked line for shadowing: seek back to its start once playback reaches the end
  useEffect(() => {
    if (!loopLine || !canSeek || lineTimes.length === 0 || loopIndex == null) return;

    const start = lineTimes[loopIndex];
    const end =
      loopIndex + 1 < lineTimes.length
        ? lineTimes[loopIndex + 1]
        : durationSec || start + 8;

    if (positionSec >= end - 0.15 || positionSec < start - 0.5) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSeek(start);
    }
  }, [positionSec, loopLine, canSeek, loopIndex, lineTimes, durationSec]);

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
    if (!fullSong || playerInitRef.current) return;
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
  }, [fullSong]);

  // Loads the YouTube IFrame Player API and creates a player for YouTube songs.
  // This gives everyone full-song playback (with the video) without Spotify.
  useEffect(() => {
    if (!youtubeMode) return;
    let cancelled = false;

    function createPlayer() {
      if (cancelled || !ytContainerRef.current || ytPlayerRef.current) return;
      // Let YouTube build into a child node React doesn't manage, so its DOM
      // surgery (replacing the element with an iframe) never fights React.
      const mount = document.createElement("div");
      ytContainerRef.current.appendChild(mount);
      ytPlayerRef.current = new window.YT.Player(mount, {
        videoId: youtubeId,
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: (event) => {
            setPlayerReady(true);
            setDurationSec(event.target.getDuration() || 0);
          },
          onStateChange: (event) => {
            const playing = event.data === window.YT.PlayerState.PLAYING;
            setIsPlaying(playing);
            if (playing) setDurationSec(event.target.getDuration() || 0);
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      // The API calls this global once loaded; chain any existing handler.
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previous) previous();
        createPlayer();
      };
      if (!document.getElementById("yt-iframe-api")) {
        const script = document.createElement("script");
        script.id = "yt-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      try {
        if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
          ytPlayerRef.current.destroy();
        }
      } catch {
        // Player may not be fully initialized yet; ignore teardown errors.
      }
      ytPlayerRef.current = null;
      if (ytContainerRef.current) ytContainerRef.current.innerHTML = "";
    };
  }, [youtubeMode, youtubeId]);

  // Polls the YouTube player's time so lyric highlighting/looping stay in sync
  useEffect(() => {
    if (!youtubeMode || !isPlaying) return;

    const intervalId = setInterval(() => {
      const player = ytPlayerRef.current;
      if (player && player.getCurrentTime) {
        setPositionSec(player.getCurrentTime());
        const duration = player.getDuration();
        if (duration) setDurationSec(duration);
      }
    }, 250);

    return () => clearInterval(intervalId);
  }, [youtubeMode, isPlaying]);

  // Keeps the position advancing smoothly while the full song plays (SDK only emits on changes)
  useEffect(() => {
    if (!fullSong || !isPlaying) return;

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
  }, [fullSong, isPlaying]);

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

  // Plays/pauses the active source: YouTube, full song (Premium), or 30s preview
  async function togglePlayback() {
    if (youtubeMode) {
      const player = ytPlayerRef.current;
      if (!player) return;
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
      return;
    }

    if (!fullSong) {
      togglePreview();
      return;
    }

    const player = playerRef.current;
    if (!player) return;

    // First press starts the track on our device; later presses just toggle play/pause
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      try {
        await startPlayback(deviceIdRef.current, trackId);
      } catch (err) {
        console.error(err);
        hasStartedRef.current = false;
      }
    } else {
      player.togglePlay();
    }
  }

  // Loads the WordSaveModal when a word gets clicked
  async function handleWordClick(word) {
    setSelectedWord(word);
    setSelectedWordTranslation('Loading...')
    setSelectedContext(null)

    const line = lyrics[activeLineIndex]?.original || ''

    try {
      const data = await getWordContext(
        word,
        line,
        sourceLanguage.code,
        targetLanguage.code
      )

      setSelectedWordTranslation(data.translation || 'Translation unavailable')
      setSelectedContext({
        line: data.line,
        contextual: data.contextual,
        baseForm: data.baseForm,
        example: data.example,
        exampleTranslation: data.exampleTranslation,
      })
    } catch (err) {
      console.error(err)
      setSelectedWordTranslation('Translation unavailable')
    }
  }

  // Closes the WordSaveModal
  function closeModal() {
    setSelectedWord(null);
    setSelectedWordTranslation('')
    setSelectedContext(null)
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
      </div>

      {/* YouTube songs play the full track (with video) for everyone */}
      {youtubeMode && (
        <div className="youtube-stage">
          <div className="youtube-frame" ref={ytContainerRef} />
        </div>
      )}

      {/* YouTube: full song for all; else Premium gets the SDK, free gets 30s preview */}
      <NowPlaying
        coverUrl={coverUrl}
        title={selectedSong.title}
        artist={selectedSong.artist}
        isPlaying={isPlaying}
        positionSec={positionSec}
        durationSec={durationSec}
        onToggle={togglePlayback}
        onSeek={handleSeek}
        disabled={canSeek ? !playerReady : !previewUrl}
        note={
          youtubeMode
            ? playerReady
              ? "Full song · YouTube"
              : "Loading video..."
            : fullSong
              ? playerReady
                ? "Full song"
                : "Connecting to Spotify..."
              : "30-second preview"
        }
      />

      {/* Shadowing tool: loop the active line (any full/seekable source) */}
      {canSeek && lineTimes.length > 0 && (
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

      {!fullSong && !youtubeMode && previewUrl && (
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

      {!isLoading && lyrics.length === 0 && !error && (
        <p className="page-text">No lyrics loaded yet</p>
      )}

      {/* Romanization helps learners read non-Latin scripts (e.g. pinyin, romaji) */}
      {canRomanize && lyrics.length > 0 && (
        <div className="practice-controls">
          <button
            className={showRomanization ? "practice-button practice-active" : "practice-button"}
            onClick={toggleRomanization}
          >
            {showRomanization ? "Hide romanization" : "Show romanization"}
          </button>
        </div>
      )}

      {lyrics.length > 0 && (
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
              role="button"
              tabIndex={0}
              title="Jump to this line"
              onClick={() => handleLineClick(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleLineClick(index);
                }
              }}
            >
              <p>{line.translation || 'Translation unavailable'}</p>
              <span>{line.original}</span>
              {showRomanization && romanized[index] && (
                <span className="romaji">{romanized[index]}</span>
              )}
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
      )}

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
          to="/quiz"
          state={{
            song: selectedSong,
            songId,
            sourceLanguage,
            targetLanguage,
            savedWords,
            linesReviewed: lyrics.length,
          }}
          className="main-button"
        >
          Take the Quiz
        </Link>

        <Link
          to="/lesson-complete"
          state={{
            song: selectedSong,
            sourceLanguage,
            targetLanguage,
            savedWords,
            linesReviewed: lyrics.length,
          }}
          className="secondary-button"
        >
          Skip to Finish
        </Link>
      </div>

      {selectedWord && (
        <WordSaveModal
          word={selectedWord}
          wordTranslation={selectedWordTranslation}
          targetLabel={targetLanguage?.label}
          baseForm={selectedContext?.baseForm}
          exampleSentence={selectedContext?.example}
          exampleTranslation={selectedContext?.exampleTranslation}
          lyricLine={lyrics[activeLineIndex]?.original}
          contextualMeaning={selectedContext?.contextual}
          onClose={closeModal}
          onSave={saveWord}
        />
      )}
    </div>
  );
}

export default LyricsPlayer;
