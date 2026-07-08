import { useState } from 'react'
import WordCard from '../components/WordCard'
import Navbar from '../components/Navbar'
import { mockWords } from '../data/mockWords'

function MyWords() {
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState('')

  const filteredWords = mockWords.filter((item) =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.songTitle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="page">
      
      <Navbar />

      <div className="section-row">
        <h2 className="section-title">My Words</h2>
        <div className="word-count">
          {mockWords.length} words saved
        </div>
      </div>

      <p className="page-text">
        Review your saved vocabulary from song lyrics
      </p>

      <div className="search-box">
        <input
          className="search-input"
          type="text"
          placeholder="search-words"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <button 
        className="main-button wide-button"
        onClick={() => setMessage('Flashcard review coming soon!')}
      >
        Start Flashcard Review
      </button>

      {message && <p className="page-text">{message}</p>}
      
      {filteredWords.map((item) =>
        <WordCard
          key={item.word}
          word={item.word}
          definition={item.definition}
          songTitle={item.songTitle}
          dateAdded={item.dateAdded}
        />
      )}

      {filteredWords.length === 0 && (
        <p className="page-text">No saved words found</p>
      )}
    </div>
  )
}

export default MyWords