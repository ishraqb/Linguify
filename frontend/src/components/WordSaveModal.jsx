import { useEffect } from "react"
import Icon from "./Icon"

/**
 * Pop up modal that appears after user taps a word in the lyrics.
 * Shows the word, its meaning (in the language being learned), the base form,
 * a real example sentence, and the lyric line it came from, with the option to
 * save it to My Words or dismiss.
 */
function WordSaveModal({
    word,
    wordTranslation,
    targetLabel,
    baseForm,
    exampleSentence,
    exampleTranslation,
    lyricLine,
    contextualMeaning,
    onClose,
    onSave,
    saveError,
    saving,
}) {
    const hasTranslation =
        wordTranslation &&
        wordTranslation !== "Loading..." &&
        wordTranslation !== "Translation unavailable"

    useEffect(() => {
        function onKey(event) {
            if (event.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onClose])

    return (
        <div className="modal-background" onClick={onClose}>
            <div
                className="word-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="word-modal-title"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="word-modal-head">
                    <span className="word-modal-eyebrow">New word</span>
                    <button className="close-button" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div className="word-modal-hero">
                    <h2 id="word-modal-title" className="word-modal-word">{word}</h2>
                    <p className={hasTranslation ? "word-modal-translation" : "word-modal-translation muted"}>
                        {hasTranslation ? wordTranslation : (wordTranslation || "Translation unavailable")}
                    </p>
                    <span className="word-modal-meaning-label">
                        Meaning{targetLabel ? ` (${targetLabel})` : ''}
                    </span>
                </div>

                {baseForm && (
                    <p className="word-modal-base">
                        <span className="word-modal-label">Base form</span> {baseForm}
                    </p>
                )}

                {exampleSentence && (
                    <div className="word-modal-line">
                        <span className="word-modal-label">Example</span>
                        <p className="word-modal-original">“{exampleSentence}”</p>
                        {exampleTranslation && (
                            <p className="word-modal-context">{exampleTranslation}</p>
                        )}
                    </div>
                )}

                <div className="word-modal-line">
                    <span className="word-modal-label">In the song</span>
                    <p className="word-modal-original">{lyricLine || "No lyric line available"}</p>
                    {contextualMeaning && (
                        <p className="word-modal-context">{contextualMeaning}</p>
                    )}
                </div>

                {saveError && <p className="page-text">{saveError}</p>}

                <div className="button-row">
                    <button className="secondary-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="main-button" onClick={onSave} disabled={saving}>
                        <Icon name="star" size={16} fill /> {saving ? "Saving…" : "Save to My Words"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WordSaveModal
