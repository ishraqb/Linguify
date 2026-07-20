/**
 * Reusable card for a saved vocabulary word.
 * - In normal mode the whole card is clickable to open its flashcard.
 * - In select mode it shows a checkbox for multi-select (bulk removal).
 * A remove button is shown when onRemove is provided and we're not selecting.
 */
function WordCard({
    word,
    translation,
    songTitle,
    dateAdded,
    onRemove,
    onClick,
    selectable = false,
    selected = false,
    onToggleSelect,
}) {
    const clickable = selectable || Boolean(onClick)

    function handleCardClick() {
        if (selectable) {
            onToggleSelect && onToggleSelect()
        } else if (onClick) {
            onClick()
        }
    }

    return (
        <div
            className={
                'word-card' +
                (clickable ? ' word-card-clickable' : '') +
                (selected ? ' word-card-selected' : '')
            }
            onClick={clickable ? handleCardClick : undefined}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
        >
            {selectable && (
                <input
                    type="checkbox"
                    className="word-card-check"
                    checked={selected}
                    readOnly
                    aria-label={`Select ${word}`}
                />
            )}

            <div className="word-card-main">
                <h3>{word}</h3>
                <p className="word-card-translation">{translation}</p>
            </div>

            <div className="word-card-meta">
                {songTitle && <span className="word-card-song">{songTitle}</span>}
                {dateAdded && <span className="word-card-date">{dateAdded}</span>}
            </div>

            {onRemove && !selectable && (
                <button
                    className="word-remove-button"
                    onClick={(event) => {
                        event.stopPropagation()
                        onRemove()
                    }}
                    aria-label={`Remove ${word}`}
                >
                    Remove
                </button>
            )}
        </div>
    )
}

export default WordCard
