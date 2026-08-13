import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SongCard from '../components/SongCard'
import WordCard from '../components/WordCard'
import ProgressCard from '../components/ProgressCard'
import { getRecentlyPlayedSongs, getSavedWords, getPlaylists, getPlaylistTracks, getProgress, updateDailyGoal } from '../services/api'

/**
 * Dashboard view for signed in users
 * Displays their recently played songs, their Spotify playlists, and recently saved words
 */
function Dashboard() {
  const [recentlyPlayedSongs, setRecentlyPlayedSongs] = useState([])
  const [recentWords, setRecentWords] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistTracks, setPlaylistTracks] = useState([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sectionErrors, setSectionErrors] = useState({})

  // Loads in the recently played songs, playlists, and recent saved words
  useEffect(() => {
    async function loadDashboard() {
      const errors = {}

      const [tracksResult, listsResult, wordsResult, statsResult] = await Promise.allSettled([
        getRecentlyPlayedSongs(),
        getPlaylists(),
        getSavedWords(),
        getProgress(),
      ])

      if (tracksResult.status === 'fulfilled') {
        setRecentlyPlayedSongs(tracksResult.value || [])
      } else {
        errors.recent = 'Could not load recently played songs.'
      }

      if (listsResult.status === 'fulfilled') {
        setPlaylists(listsResult.value || [])
      } else {
        errors.playlists = 'Could not load playlists.'
      }

      if (wordsResult.status === 'fulfilled' && Array.isArray(wordsResult.value)) {
        setRecentWords(wordsResult.value.slice(0, 4))
      } else {
        errors.words = 'Could not load saved words.'
      }

      if (statsResult.status === 'fulfilled') {
        setProgress(statsResult.value)
      } else {
        errors.progress = true
      }

      setSectionErrors(errors)
      setLoading(false)
    }

    loadDashboard()
  }, [])

  async function handleGoalChange(nextGoal) {
    try {
      const stats = await updateDailyGoal(nextGoal)
      setProgress(stats)
    } catch {
      // Keep the previous goal if the update fails.
    }
  }

  // Opens a playlist and loads its tracks so the user can start a lesson from any of them
  async function openPlaylist(playlist) {
    setSelectedPlaylist(playlist)
    setPlaylistTracks([])
    setLoadingTracks(true)
    try {
      const tracks = await getPlaylistTracks(playlist.id)
      setPlaylistTracks(tracks || [])
    } catch {
      setPlaylistTracks([])
    } finally {
      setLoadingTracks(false)
    }
  }

  return (
    <div className="page">
      <Navbar />

      <div className="page-header">
        <span className="hero-badge">Welcome back</span>
        <h1 className="page-title">Pick up where you left off</h1>
      </div>

      <ProgressCard
        progress={progress}
        loading={loading}
        onGoalChange={handleGoalChange}
      />

      <Link to="/search" className="main-button wide-button">
        Begin New Song Lesson
      </Link>

      <h2 className="section-title">Recently Played</h2>

      {loading ? (
        <p className="page-text">Loading your recent songs…</p>
      ) : sectionErrors.recent ? (
        <p className="page-text">{sectionErrors.recent}</p>
      ) : recentlyPlayedSongs.length === 0 ? (
        <p className="page-text">Nothing here yet — play a song on Spotify and it will show up.</p>
      ) : (
        <div className="card-grid">
          {recentlyPlayedSongs.slice(0, 6).map((song) => (
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
          ))}
        </div>
      )}

      <h2 className="section-title">Your Playlists</h2>

      {/* Browsing a playlist swaps the grid for its track list */}
      {selectedPlaylist ? (
        <div>
          <button className="secondary-button" onClick={() => setSelectedPlaylist(null)}>
            ← Back to playlists
          </button>

          <h3 className="playlist-heading">{selectedPlaylist.name}</h3>

          {loadingTracks && <p className="page-text">Loading tracks...</p>}

          {!loadingTracks &&
            playlistTracks.map((song, index) => (
              <SongCard
                key={song.id || index}
                id={song.id}
                title={song.title}
                artist={song.artist}
                album={song.album}
                coverUrl={song.coverUrl}
                previewUrl={song.previewUrl}
              />
            ))}

          {!loadingTracks && playlistTracks.length === 0 && (
            <p className="page-text">No playable tracks in this playlist.</p>
          )}
        </div>
      ) : loading ? (
        <p className="page-text">Loading playlists…</p>
      ) : sectionErrors.playlists ? (
        <p className="page-text">{sectionErrors.playlists}</p>
      ) : playlists.length === 0 ? (
        <p className="page-text">No playlists found. Playlists you own or follow will show up here.</p>
      ) : (
        <div className="playlist-grid">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              className="playlist-card"
              onClick={() => openPlaylist(playlist)}
            >
              <div className="playlist-cover">
                {playlist.coverUrl ? (
                  <img src={playlist.coverUrl} alt={`${playlist.name} cover`} />
                ) : (
                  'Playlist'
                )}
              </div>
              <div className="playlist-name">{playlist.name}</div>
              <div className="playlist-count">{playlist.trackCount} songs</div>
            </button>
          ))}
        </div>
      )}

      <div className="section-row">
        <h2 className="section-title">Recent Words</h2>
        <Link to="/my-words" className="secondary-button">View all</Link>
      </div>

      {loading ? (
        <p className="page-text">Loading saved words…</p>
      ) : sectionErrors.words ? (
        <p className="page-text">{sectionErrors.words}</p>
      ) : recentWords.length === 0 ? (
        <p className="page-text">No saved words yet — tap words during a lesson to save them.</p>
      ) : (
        <div className="card-grid">
          {recentWords.map((item) => (
            <WordCard
              key={item.id}
              word={item.word}
              translation={item.translation || item.definition}
              songTitle={item.songTitle}
              dateAdded={item.dateAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
