import { useState } from 'react'
import Navbar from '../components/Navbar'
import SongCard from '../components/SongCard'
import { mockSongs } from '../data/mockSongs'

function Search() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSongs = mockSongs.filter((song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.language.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="page">
      <Navbar />

      <h2 className="section-title">Search Songs</h2>

      <div className="search-box">
        <input
          className="search-input"
          type="text"
          placeholder="Search for a song, artist, or language"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <button className="secondary-button">Search</button>
      </div>

      <h2 className="section-title">Search Results</h2>

      {filteredSongs.map((song) =>
        <SongCard
          key={song.id}
          title={song.title}
          artist={song.artist}
          language={song.language}
          coverUrl={song.coverUrl}
        />
      )}

      {filteredSongs.length === 0 && (
        <p className="page-text">No Songs found. Try another search</p>
      )}
      
    </div>
  )
}

export default Search