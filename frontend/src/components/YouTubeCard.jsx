import Icon from './Icon'

/**
 * Reusable card for a YouTube search result.
 * Preview plays inline; Start lesson is the only way into the lesson flow so
 * a stray tap doesn't skip the preview.
 */
function YouTubeCard({ title, channelTitle, thumbnailUrl, onStart, onPreview }) {
    return (
        <div className="song-card">
            <div className="song-cover">
                {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={`${title} thumbnail`} className="song-cover-img" />
                ) : (
                    <div className="song-cover-fallback"><Icon name="music" size={26} /></div>
                )}
            </div>

            <div className="song-info">
                <h3>{title}</h3>
                <p>{channelTitle}</p>
            </div>

            <div className="song-card-actions">
                {onPreview && (
                    <button
                        className="secondary-button"
                        onClick={onPreview}
                    >
                        Preview
                    </button>
                )}
                <button
                    className="main-button"
                    onClick={onStart}
                >
                    Start lesson
                </button>
            </div>
        </div>
    )
}

export default YouTubeCard
