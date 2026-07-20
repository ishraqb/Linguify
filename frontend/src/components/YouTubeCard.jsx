import Icon from './Icon'

/**
 * Reusable card for a YouTube search result.
 * Clicking the card (or Enter/Space) starts a lesson from the video; a small
 * Preview button plays it inline without leaving the page.
 */
function YouTubeCard({ title, channelTitle, thumbnailUrl, onStart, onPreview }) {
    return (
        <div
            className="song-card word-card-clickable"
            onClick={onStart}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onStart()
                }
            }}
        >
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
                        onClick={(event) => {
                            event.stopPropagation()
                            onPreview()
                        }}
                    >
                        Preview
                    </button>
                )}
                <button
                    className="main-button"
                    onClick={(event) => {
                        event.stopPropagation()
                        onStart()
                    }}
                >
                    Start lesson
                </button>
            </div>
        </div>
    )
}

export default YouTubeCard
