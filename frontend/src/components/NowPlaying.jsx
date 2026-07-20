import Icon from "./Icon";

// Formats a number of seconds into m:ss for the player timestamps
function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Spotify-style now-playing bar: album art, song info, a play/pause button,
 * and a seekable progress bar. Works for both the 30s preview and full song.
 */
function NowPlaying({
  coverUrl,
  title,
  artist,
  isPlaying,
  positionSec,
  durationSec,
  onToggle,
  onSeek,
  disabled,
  note,
}) {
  const progress = durationSec ? Math.min(100, (positionSec / durationSec) * 100) : 0;

  // Converts a click on the progress bar into a seek time
  function handleSeek(event) {
    if (!durationSec || disabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(durationSec, ratio * durationSec)));
  }

  return (
    <div className="now-playing">
      <div className="now-playing-top">
        <div className="now-playing-art">
          {coverUrl ? (
            <img src={coverUrl} alt={title} />
          ) : (
            <div className="now-playing-art-placeholder"><Icon name="music" size={26} strokeWidth={1.6} /></div>
          )}
        </div>

        <div className="now-playing-info">
          <span className="now-playing-title">{title}</span>
          <span className="now-playing-artist">
            {artist}
            {note ? ` · ${note}` : ""}
          </span>
        </div>

        <button
          className="now-playing-toggle"
          onClick={onToggle}
          disabled={disabled}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      <div className="now-playing-bar">
        <span>{formatTime(positionSec)}</span>
        <div className="now-playing-progress" onClick={handleSeek}>
          <div
            className="now-playing-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span>{formatTime(durationSec)}</span>
      </div>
    </div>
  );
}

export default NowPlaying;
