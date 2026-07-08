import WordCard from '../components/WordCard'
import Navbar from '../components/Navbar'

function MyWords() {
  return (
    <div className="page">
      
      <Navbar />

      <div className="section-row">
        <h2 className="section-title">My Words</h2>
        <div className="word-count">Word Count</div>
      </div>

      <p className="page-text">
        Review your saved vocabulary from song lyrics
      </p>

      <div className="search-box">
        <input
          className="search-input"
          type="text"
          placeholder="search-words"
        />
      </div>

      <button className="main-button wide-button">
        Start Flashcard Review
      </button>
      
      <WordCard
        word="estrellas"
        definition="stars"
        songTitle="DÁKITI"
        dateAdded="Today"
      />
    </div>
  )
}

export default MyWords