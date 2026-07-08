function WordSaveModal() {
    return (
        <div className="modal-background">
            <div className="word-modal">
                <button className="close-button">X</button>

                <h2>New Word</h2>

                <div className="modal-section">
                    <h3>Word</h3>
                    <p>contigo</p>
                </div>

                <div className="modal-section">
                    <h3>Translation</h3>
                    <p>with you</p>
                </div>

                <div className="modal-section">
                    <h3>Definition</h3>
                    <p>Used to say “with you” or “together with you.”</p>
                </div>

                <div className="modal-section">
                    <h3>From Lyrics</h3>
                    <p>Que me quiero ir contigo</p>
                </div>

                <div className="modal-section">
                    <h3>Example Sentence</h3>
                    <p>Quiero estudiar contigo.</p>
                </div>

                <div className="button-row">
                    <button className="secondary-button">Cancel</button>
                    <button className="main-button">Save to My Words</button>
                </div>
            </div>
        </div>
    )
}

export default WordSaveModal