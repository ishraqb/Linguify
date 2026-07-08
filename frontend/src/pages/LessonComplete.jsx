import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { mockLessonSummary } from '../data/mockLessonSummary'

function LessonComplete() {
  const lessonSummary = {
    songTitle: 'DÁKITI',
    aritst: 'Bad Bunny, Jhay Cortez',
    language: 'Spanish',
    linesReviewed: 3, 
    wordsSaved: 3,
    newWords: [
      {
        id: 1,
        word: 'contigo',
        translation: 'with you',
        definition: 'together with you',
      },
      {
        id: 2,
        word: 'cuidad',
        translation: 'city',
        definition: 'a large town',
      },
      {
        id: 3,
        word: 'estrellas',
        translation: 'stars',
        definition: 'bright objects seen in the night sky',
      },
    ],
  }

  return (
    <div className="page">
      <Navbar/>

      <div className="complete-header">
        <h1>Song Finished</h1>
        <p>
          You completed a lesson for {lessonSummary.songTitle} by {' '}
          {lessonSummary.artist}.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Lines Reviewed</h3>
          <p>{lessonSummary.linesReviewed}</p>
        </div>

        <div className="stat-card">
          <h3>Words Saved</h3>
          <p>{lessonSummary.wordsSaved}</p>
        </div>

        <div className="stat-card">
          <h3>Language</h3>
          <h3>{lessonSummary.language}</h3>
        </div>
      </div>

      <div className="new-words-box">
        <h2>New words learned</h2>

        <div className="word-row word-row-header">
          <p>Word</p>
          <p>Translation</p>
          <p>Definition</p>
        </div>

        {lessonSummary.newWords.map((item) => (
          <div className="word-row" key={item.id}>
            <p>{item.word}</p>
            <p>{item.translation}</p>
            <p>{item.definition}</p>
          </div>
        ))}
      </div>

      <div className="button-row">
        <Link to="/dashboard" className="secondary-button">
          Back to Dashboard
        </Link>

        <Link to="/my-words" className="secondary-button">
          Go to My Words
        </Link>

        <Link to="/search" className="secondary-button">
          Start a New Song
        </Link>
      </div>
    </div>
  )
}

export default LessonComplete