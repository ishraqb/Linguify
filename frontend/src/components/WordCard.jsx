function WordCard({ word, definition, songTitle, dateAdded }) {
    return (
        <div className="word-card">
            <div>
                <h3>{word}</h3>
                <h3>{definition}</h3>
            </div>

            <div>
                <p>{songTitle}</p>
                <p>{dateAdded}</p>
            </div>
        </div>
    )
}

export default WordCard