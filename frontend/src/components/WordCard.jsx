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
                {onDelete && (
                    <button className="secondary-button" onClick={onDelete}>
                        Remove
                    </button>
                )}
            </div>

            {onRemove && (
                <button onClick={onRemove}>
                    Remove
                </button>
            )}
        </div>
    )
}

export default WordCard
