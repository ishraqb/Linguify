import { useEffect, useEffectEvent, useState } from 'react'
import WordCard from '../components/WordCard'
import Navbar from '../components/Navbar'
import { mockWords } from '../data/mockWords'
import { getSavedWords } from '../services/api'

function MyWords() {
  const [searchTerm, setSearchTerm] = useState('')
  const [words, setWords] = useState(mockWords)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadWords() {
      try {
        setError('')
        const savedWords = await getSavedWords()

        if (savedWords.length > 0) {
          setWords(savedWords)
        }
      } catch (err) {
        console.error(err)
        setError("Using demo saved words for now")
      }
    }

    loadWords()
  }, [])

  const filteredWords = words.filter((item) =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="page">
      
      <Navbar />

      <h2 className="section-title">My Words</h2>

      <input
        className="search-input"
        type="text"
        placeholder="Search saved words"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      {error && <p className="page-text">{error}</p>}

      {filteredWords.map((item) =>
        <WordCard
          key={item.id}
          word={item.word}
          definition={item.definition || item.translation}
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