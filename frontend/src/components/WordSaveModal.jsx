import Icon from "./Icon"

/**
 * Pop up modal that appears after user taps a word in the lyrics.
 * Shows the word, its translation, and the lyric line it came from, with the
 * option to save it to My Words or dismiss.
 */
function WordSaveModal({ word, wordTranslation, lyricLine, contextualMeaning, onClose, onSave }) {
    const hasTranslation =
        wordTranslation &&
        wordTranslation !== "Loading..." &&
        wordTranslation !== "Translation unavailable"

    return (
        <div className="modal-background" onClick={onClose}>
            <div className="word-modal" onClick={(event) => event.stopPropagation()}>
                <div className="word-modal-head">
                    <span className="word-modal-eyebrow">New word</span>
                    <button className="close-button" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div className="word-modal-hero">
                    <h2 className="word-modal-word">{word}</h2>
                    <p className={hasTranslation ? "word-modal-translation" : "word-modal-translation muted"}>
                        {hasTranslation ? wordTranslation : (wordTranslation || "Translation unavailable")}
                    </p>
                </div>

                <div className="word-modal-line">
                    <span className="word-modal-label">In this line</span>
                    <p className="word-modal-original">{lyricLine || "No lyric line available"}</p>
                    {contextualMeaning && (
                        <p className="word-modal-context">{contextualMeaning}</p>
                    )}
                </div>

                <div className="button-row">
                    <button className="secondary-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="main-button" onClick={onSave}>
                        <Icon name="star" size={16} fill /> Save to My Words
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WordSaveModal
