/**
 * Reusable card for displaying a saved vocabulary word from a song
 * Optionally shows a remove button when OnRemove is used
 */
function WordCard({ word, translation, songTitle, dateAdded, onRemove }) {
    return (
        <div className="word-card">
            <div>
                <h3>{word}</h3>
                <p>{translation}</p>
            </div>

            <div>
                <p>{songTitle}</p>
                <p>{dateAdded}</p>
            </div>

            {onRemove && (
                <button className="secondary-buton" onClick={onRemove}>
                    Remove
                </button>
            )}
        </div>
    )
}

export default WordCard
