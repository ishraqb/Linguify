import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import SongCard from '../components/SongCard'
import { searchSongs } from '../services/api'

/**
 * Page for searching Spotify songs by the title or artists
 * Displays matching song results as SongCards and allows users to start a lesson
 */
function Search() {
  const [searchTerm, setSearchTerm] = useState('')
  const [songs, setSongs] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Searches for songs whenever the search input is changed
  useEffect(() => {
    async function loadSongs() {
      if (!searchTerm.trim()) {
        setSongs([])
        return
      }

      try {
        setIsLoading(true)
        setError('')

        const results = await searchSongs(searchTerm)
        setSongs(results)
      } catch (err) {
        setError('Could not load songs, Make sure you are logged in with Spotify')
      } finally {
        setIsLoading(false)
      }
    }

    loadSongs()
  }, [searchTerm])

  return (
    <div className="page">
      <Navbar />

      <h2 className="section-title">Search Songs</h2>

      <div className="search-box">
        <input
          className="search-input"
          type="text"
          placeholder="Search for a song or artist"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <button className="secondary-button">Search</button>
      </div>

      {isLoading && <p className="page-text">Loading songs...</p>}

      {error && <p className="page-text">{error}</p>}

      {!isLoading &&
        songs.map((song) => (
          <SongCard
            key={song.id}
            id={song.id}
            title={song.title}
            artist={song.artist}
            language={song.language}
            album={song.album}
            coverUrl={song.coverUrl}
            previewUrl={song.previewUrl}
          />
        ))
      }

      {!isLoading && searchTerm && songs.length === 0 && !error && (
        <p className="page-text">No songs found. Try another search</p>
      )}
      
    </div>
  )
}

export default Search