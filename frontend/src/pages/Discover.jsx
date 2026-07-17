import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import SongCard from '../components/SongCard'
import { discoverSongs } from '../services/api'
import { findLanguage } from '../data/languages'

const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

/**
 * Discovery page: browse the song catalog and filter by language, difficulty,
 * and a text search on title or artist.
 */
function Discover() {
  const [songs, setSongs] = useState([])
  const [languages, setLanguages] = useState([])
  const [languageFilter, setLanguageFilter] = useState(null)
  const [difficultyFilter, setDifficultyFilter] = useState(null)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Reload results whenever a filter changes; debounce so typing isn't chatty.
  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true)
        setError('')
        const data = await discoverSongs({
          language: languageFilter,
          difficulty: difficultyFilter,
          q: query.trim(),
        })
        if (!active) return
        setSongs(data.songs || [])
        // Keep the language list stable from the unfiltered set of results.
        if (!languageFilter && Array.isArray(data.languages)) {
          setLanguages(data.languages)
        }
      } catch (err) {
        if (active) setError('Could not load songs. Make sure you are logged in with Spotify.')
      } finally {
        if (active) setIsLoading(false)
      }
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [languageFilter, difficultyFilter, query])

  return (
    <div className="page">
      <Navbar />

      <h2 className="section-title">Discover Songs</h2>
      <p className="page-text">Find songs to learn from by language and difficulty.</p>

      <input
        className="search-input"
        type="text"
        placeholder="Search by title or artist"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="filter-group">
        <span className="filter-label">Level</span>
        <div className="filter-pills">
          <button
            className={difficultyFilter ? 'filter-pill' : 'filter-pill filter-pill-active'}
            onClick={() => setDifficultyFilter(null)}
          >
            All
          </button>
          {DIFFICULTY_LEVELS.map((level) => (
            <button
              key={level}
              className={
                difficultyFilter === level ? 'filter-pill filter-pill-active' : 'filter-pill'
              }
              onClick={() => setDifficultyFilter(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {languages.length > 0 && (
        <div className="filter-group">
          <span className="filter-label">Language</span>
          <div className="filter-pills">
            <button
              className={languageFilter ? 'filter-pill' : 'filter-pill filter-pill-active'}
              onClick={() => setLanguageFilter(null)}
            >
              All
            </button>
            {languages.map((code) => (
              <button
                key={code}
                className={
                  languageFilter === code ? 'filter-pill filter-pill-active' : 'filter-pill'
                }
                onClick={() => setLanguageFilter(code)}
              >
                {findLanguage(code)?.label || code}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && <p className="page-text">Loading songs...</p>}
      {error && <p className="page-text">{error}</p>}

      {!isLoading &&
        songs.map((song) => (
          <SongCard
            key={song.songId}
            id={song.id}
            title={song.title}
            artist={song.artist}
            album={song.album}
            coverUrl={song.coverUrl}
            language={findLanguage(song.language)?.label || song.language}
            difficulty={song.difficulty}
          />
        ))}

      {!isLoading && songs.length === 0 && !error && (
        <p className="page-text">No songs match these filters yet. Try a different combination.</p>
      )}
    </div>
  )
}

export default Discover
