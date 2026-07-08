import Navbar from '../components/Navbar'
import SongCard from '../components/SongCard'
import { useState } from 'react'

function Search() {
  const [searchTerm, setSearchTerm] = useState('')

  const songs = [
    { title: 'DÁKITI', artist: 'Bad Bunny, Jhay Cortez', language: 'Spanish' },
    { title: 'Despacito', artist: 'Luis Fonsi', language: 'Spanish' },
    { title: 'La Vie En Rose', artist: 'Édith Piaf', language: 'French' },
    { title: 'Dynamite', artist: 'BTS', language: 'Korean' },
  ]

  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="page">
      <Navbar />

      <h2 className="section-title">Search Header</h2>

      <div className="search-box">
        <input
          className="search-input"
          type="text"
          placeholder="Search for a song"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <button className="secondary-button">Search</button>
      </div>

      <div className="section-row">
        <h2 className="section-title">Recently Played Header</h2>
        <button className="secondary-button">Show all</button>
      </div>

      {filteredSongs.map((song) =>
        <SongCard
          key={song.title}
          title={song.title}
          artist={song.artist}
          language={song.language}
        />
      )}

      {filteredSongs.length === 0 && (
        <p className="page-text">No Songs found. Try another search</p>
      )}
      
    </div>
  )
}

export default Search