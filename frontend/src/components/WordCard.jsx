function WordCard({ word, definition, songTitle, dateAdded, onDelete }) {
    return (
        <div className="word-card">
            <div>
                <h3>{word}</h3>
                <p>{definition}</p>
            </div>

            <div>
                <p>{songTitle}</p>
                <p>{dateAdded}</p>
                {onDelete && (
                    <button className="secondary-button" onClick={onDelete}>
                        Remove
                    </button>
                )}
            </div>
        </div>
    )
}

export default WordCard
