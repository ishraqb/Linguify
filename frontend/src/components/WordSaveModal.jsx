/** 
 * Pop up modal that appears after user taps a word in the lyrics
 * Shows the word translation and lyric line, and provides the option to save to My Words or exit out (using cancel or x)
 */
function WordSaveModal({ word, wordTranslation, lyricLine, contextualMeaning, onClose, onSave }) {
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

                <div className="modal-section">
                    <h3>In this line</h3>
                    <p>{lyricLine || "No lyric line available"}</p>
                    {contextualMeaning && (
                        <p className="context-translation">{contextualMeaning}</p>
                    )}
                </div>

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