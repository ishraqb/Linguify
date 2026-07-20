function YouTubeCard({ title, channelTitle, thumbnailUrl, onSelect }) {
    return (
        <div
            className="song-card"
            onClick={onSelect}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect()
                }
            }}
        >
            <div className="song-cover">
                {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={`${title} thumbnail`} className="song-cover-img" />
                ) : (
                    'Cover'
                )}
            </div>

            <div className="song-info">
                <h3>{title}</h3>
                <p>{channelTitle}</p>
            </div>
        </div>
    )
}

export default YouTubeCard
