import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import SongCard from '../components/SongCard'
import YouTubeCard from '../components/YouTubeCard'
import YouTubePlayer from '../components/YouTubePlayer'
import { searchSongs, discoverSongs, getPreferences, updatePreferences, searchYoutube } from '../services/api'
import { TARGET_LANGUAGES, findLanguage } from '../data/languages'

const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

/**
 * Unified Songs page: browse the catalog by language and difficulty, or type a
 * query to search Spotify live. An empty search box shows the filtered catalog.
 * Can also switch to searching YouTube directly instead of Spotify.
 */
function Search() {
  const [query, setQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState(null)
  const [songs, setSongs] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [hideExplicit, setHideExplicit] = useState(false)

  const [source, setSource] = useState('spotify')
  const [youtubeVideos, setYoutubeVideos] = useState([])
  const [isYoutubeLoading, setIsYoutubeLoading] = useState(false)
  const [youtubeError, setYoutubeError] = useState('')
  const [selectedVideo, setSelectedVideo] = useState(null)

  // Load the saved explicit-filter preference once on mount.
  useEffect(() => {
    getPreferences()
      .then((prefs) => setHideExplicit(!!prefs.hideExplicit))
      .catch(() => {})
  }, [])

  // Persist the explicit-filter preference; results refetch via the dependency below.
  async function toggleHideExplicit() {
    const next = !hideExplicit
    setHideExplicit(next)
    try {
      await updatePreferences({ hideExplicit: next })
    } catch (err) {
      // Roll back the toggle if the save failed.
      setHideExplicit(!next)
    }
  }

  // Typing searches Spotify; an empty box browses the catalog with the filters.
  useEffect(() => {
    if (source !== 'spotify') return

    let active = true
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true)
        setError('')
        const trimmed = query.trim()

        if (trimmed) {
          const results = await searchSongs(trimmed)
          if (!active) return
          setIsSearching(true)
          setSongs(results || [])
        } else {
          const data = await discoverSongs({
            language: languageFilter || undefined,
            difficulty: difficultyFilter || undefined,
          })
          if (!active) return
          setIsSearching(false)
          setSongs(data.songs || [])
        }
      } catch (err) {
        if (active) setError('Could not load songs. Make sure you are logged in with Spotify.')
      } finally {
        if (active) setIsLoading(false)
      }
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [source, query, languageFilter, difficultyFilter, hideExplicit])

  // Typing searches YouTube directly; there's no catalog/browse equivalent for it.
  useEffect(() => {
    if (source !== 'youtube') return

    let active = true
    const trimmed = query.trim()

    if (!trimmed) {
      setYoutubeVideos([])
      setYoutubeError('')
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsYoutubeLoading(true)
        setYoutubeError('')
        const results = await searchYoutube(trimmed)
        if (!active) return
        setYoutubeVideos(results || [])
      } catch (err) {
        if (active) setYoutubeError('Could not search YouTube right now.')
      } finally {
        if (active) setIsYoutubeLoading(false)
      }
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [source, query])

  function changeSource(next) {
    setSource(next)
    setSelectedVideo(null)
  }

  return (
    <div className="page">
      <Navbar />

      <h2 className="section-title">Songs</h2>
      <p className="page-text">Browse by language and difficulty, or search for any song.</p>

      <div className="filter-group">
        <span className="filter-label">Source</span>
        <div className="filter-pills">
          <button
            className={source === 'spotify' ? 'filter-pill filter-pill-active' : 'filter-pill'}
            onClick={() => changeSource('spotify')}
          >
            Spotify
          </button>
          <button
            className={source === 'youtube' ? 'filter-pill filter-pill-active' : 'filter-pill'}
            onClick={() => changeSource('youtube')}
          >
            YouTube
          </button>
        </div>
      </div>

      <div className="search-box">
        <input
          className="search-input"
          type="text"
          placeholder={source === 'youtube' ? 'Search YouTube for a song or artist' : 'Search for a song or artist'}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {source === 'spotify' && (
        <>
          <div className="filter-group">
            <span className="filter-label">Language</span>
            <select
              className="filter-select"
              value={languageFilter}
              onChange={(event) => setLanguageFilter(event.target.value)}
            >
              <option value="">All languages</option>
              {TARGET_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                  {language.native ? ` (${language.native})` : ''}
                </option>
              ))}
            </select>
          </div>

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

          <div className="filter-group">
            <label className="explicit-toggle">
              <input type="checkbox" checked={hideExplicit} onChange={toggleHideExplicit} />
              Hide explicit songs
            </label>
          </div>

          {isSearching && (
            <p className="page-text">Showing Spotify search results. Clear the search to browse the catalog.</p>
          )}

          {isLoading && <p className="page-text">Loading songs...</p>}
          {error && <p className="page-text">{error}</p>}

          {!isLoading &&
            songs.map((song, index) => (
              <SongCard
                key={song.songId || song.id || index}
                id={song.id}
                title={song.title}
                artist={song.artist}
                album={song.album}
                coverUrl={song.coverUrl}
                previewUrl={song.previewUrl}
                language={song.language ? findLanguage(song.language)?.label || song.language : undefined}
                difficulty={song.difficulty}
                explicit={song.explicit}
              />
            ))}

          {!isLoading && songs.length === 0 && !error && (
            <p className="page-text">
              {isSearching
                ? 'No songs found. Try another search.'
                : 'No songs match these filters yet. Try a different combination.'}
            </p>
          )}
        </>
      )}

      {source === 'youtube' && (
        <>
          {selectedVideo && (
            <div style={{ marginBottom: '24px' }}>
              <YouTubePlayer videoId={selectedVideo.id} title={selectedVideo.title} />
            </div>
          )}

          {isYoutubeLoading && <p className="page-text">Searching YouTube...</p>}
          {youtubeError && <p className="page-text">{youtubeError}</p>}

          {!isYoutubeLoading && !query.trim() && (
            <p className="page-text">Type a song or artist to search YouTube.</p>
          )}

          {!isYoutubeLoading &&
            youtubeVideos.map((video) => (
              <YouTubeCard
                key={video.id}
                title={video.title}
                channelTitle={video.channelTitle}
                thumbnailUrl={video.thumbnailUrl}
                onSelect={() => setSelectedVideo(video)}
              />
            ))}

          {!isYoutubeLoading && query.trim() && youtubeVideos.length === 0 && !youtubeError && (
            <p className="page-text">No videos found. Try another search.</p>
          )}
        </>
      )}
    </div>
  )
}

export default Search
