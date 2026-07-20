/**
 * Reusable card for displaying a saved vocabulary word from a song.
 * Optionally shows a remove button when onRemove is provided.
 */
function WordCard({ word, translation, songTitle, dateAdded, onRemove }) {
    return (
        <div className="word-card">
            <div className="word-card-main">
                <h3>{word}</h3>
                <p className="word-card-translation">{translation}</p>
            </div>

            <div className="word-card-meta">
                {songTitle && <span className="word-card-song">{songTitle}</span>}
                {dateAdded && <span className="word-card-date">{dateAdded}</span>}
            </div>

            {onRemove && (
                <button className="word-remove-button" onClick={onRemove} aria-label={`Remove ${word}`}>
                    Remove
                </button>
            )}
        </div>
    )
}

export default WordCard
