function WordSaveModal({ word, wordTranslation, lyricLine, translation, onClose, onSave }) {
    return (
        <div className="modal-background">
            <div className="word-modal">
                <button className="close-button" onClick={onClose}>
                    X
                </button>

                <h2>New Word</h2>

                <div className="modal-section">
                    <h3>Word</h3>
                    <p>{word}</p>
                </div>

                <div className="modal-section">
                    <h3>Translation</h3>
                    <p>{wordTranslation || "Translation unavailable"}</p>
                </div>

                {/* <div className="modal-section">
                    <h3>Definition</h3>
                    <p>Coming soon</p>
                </div> */}

                <div className="modal-section">
                    <h3>From Lyrics</h3>
                    <p>{lyricLine || "No lyric line available"}</p>
                </div>

                {/* <div className="modal-section">
                    <h3>Example Sentence</h3>
                    <p>Coming soon</p>
                </div> */}

                <div className="button-row">
                    <button className="secondary-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="main-button" onClick={onSave}>
                        Save to My Words
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WordSaveModal