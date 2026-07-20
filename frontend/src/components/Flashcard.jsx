import { useEffect, useState } from 'react'
import Icon from './Icon'
import { getWordDetail } from '../services/api'
import { findLanguage } from '../data/languages'

// Speaks a word aloud using the browser's built-in speech synthesis (no backend needed).
function speakWord(text, languageCode) {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  if (languageCode) utterance.lang = languageCode
  utterance.rate = 0.9
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

/**
 * Quizlet-style flip flashcard for a saved word.
 * Front shows the word + pronunciation; the back shows the meaning (in the
 * language the lesson was learned in), the base/unconjugated form, a real
 * example sentence, and the song line it came from. Rich detail is fetched
 * lazily so the list stays fast.
 */
function Flashcard({ card }) {
  const [flipped, setFlipped] = useState(false)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    setFlipped(false)
    setDetail(null)
    let active = true
    getWordDetail(card.word, card.sourceLanguage, card.targetLanguage)
      .then((data) => { if (active) setDetail(data) })
      .catch(() => {})
    return () => { active = false }
  }, [card.id, card.word, card.sourceLanguage, card.targetLanguage])

  // The meaning is shown in the language the learner is studying in (target).
  const targetLabel = findLanguage(card.targetLanguage)?.label || 'translation'
  const meaning = detail?.meaning || card.translation || card.definition
  const baseForm = detail?.baseForm || card.baseForm
  const example = detail?.example
  const exampleTranslation = detail?.exampleTranslation

  return (
    <div
      className={flipped ? 'flashcard-flip flipped' : 'flashcard-flip'}
      onClick={() => setFlipped((prev) => !prev)}
    >
      <div className="flashcard-inner">
        {/* Front: the word + pronunciation */}
        <div className="flashcard-face flashcard-front">
          <span className="flashcard-eyebrow">Word</span>
          <h2>{card.word}</h2>
          <button
            className="pronounce-button"
            onClick={(event) => {
              event.stopPropagation()
              speakWord(card.word, card.sourceLanguage)
            }}
            aria-label={`Pronounce ${card.word}`}
          >
            <Icon name="volume" size={20} /> Pronounce
          </button>
          <p className="flashcard-hint">Tap card to flip</p>
        </div>

        {/* Back: meaning (in target language), base form, example, song line */}
        <div className="flashcard-face flashcard-back">
          <span className="flashcard-eyebrow">Meaning ({targetLabel})</span>
          <h2>{meaning}</h2>

          {baseForm && (
            <p className="flashcard-detail">
              <span className="flashcard-detail-label">Base form</span> {baseForm}
            </p>
          )}

          {example && (
            <div className="flashcard-block">
              <span className="flashcard-detail-label">Example</span>
              <p className="flashcard-example">“{example}”</p>
              {exampleTranslation && (
                <p className="flashcard-example-translation">{exampleTranslation}</p>
              )}
            </div>
          )}

          {card.exampleSentence && (
            <div className="flashcard-block">
              <span className="flashcard-detail-label">
                In the song{card.songTitle ? ` · ${card.songTitle}` : ''}
              </span>
              <p className="flashcard-example">“{card.exampleSentence}”</p>
            </div>
          )}

          <p className="flashcard-hint">Tap card to flip back</p>
        </div>
      </div>
    </div>
  )
}

export default Flashcard
