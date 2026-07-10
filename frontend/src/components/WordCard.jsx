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
                <button onClick={onRemove}>
                    Remove
                </button>
            )}
        </div>
    )
}

export default WordCard