import WordCard from '../components/WordCard'
import Navbar from '../components/Navbar'
import { useState } from 'react'

function MyWords() {
  const savedWords = [
    {
      word: 'contigo',
      definition: 'with you',
      songTitle: 'DÁKITI',
      dateAdded: 'Today',
    },
    {
      word: 'estrellas',
      definition: 'stars',
      songTitle: 'DÁKITI',
      dateAdded: 'Today',
    },
    {
      word: 'ciudad',
      definition: 'city',
      songTitle: 'DÁKITI',
      dateAdded: 'Yesterday',
    },
    {
      word: 'perderme',
      definition: 'to get lost',
      songTitle: 'Sample Song',
      dateAdded: 'Yesterday',
    },
  ]

  const [searchTerm, setSearchTerm] = useState('')
  const filteredWords = savedWords.filter((item) =>
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
          {savedWords.length} words saved
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

      <button className="main-button wide-button">
        Start Flashcard Review
      </button>
      
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