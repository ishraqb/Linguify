import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SongCard from '../components/SongCard'
import WordCard from '../components/WordCard'
import ProgressCard from '../components/ProgressCard'
import { getRecentlyPlayedSongs, getSavedWords, getPlaylists, getPlaylistTracks, getProgress } from '../services/api'

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

  // Loads in the recently played songs, playlists, and recent saved words
  useEffect(() => {
    async function loadRecentlyPlayed() {
      try {
        const tracks = await getRecentlyPlayedSongs()
        if (tracks.length > 0) {
          setRecentlyPlayedSongs(tracks)
        }
      } catch (err) {
        console.log("Could not load recently played songs")
      }
    }

    async function loadPlaylists() {
      try {
        const lists = await getPlaylists()
        setPlaylists(lists || [])
      } catch (err) {
        console.log("Could not load playlists")
      }
    }

    async function loadRecentWords() {
      try {
        const savedWords = await getSavedWords()

        if (Array.isArray(savedWords)) {
          setRecentWords(savedWords.slice(0, 2))
        }
      } catch (err) {
        console.log("Could not load recent words")
      }
    }

    async function loadProgress() {
      try {
        const stats = await getProgress()
        setProgress(stats)
      } catch (err) {
        console.log("Could not load progress")
      }
    }

    loadRecentlyPlayed()
    loadPlaylists()
    loadRecentWords()
    loadProgress()
  }, [])

  // Opens a playlist and loads its tracks so the user can start a lesson from any of them
  async function openPlaylist(playlist) {
    setSelectedPlaylist(playlist)
    setPlaylistTracks([])
    setLoadingTracks(true)
    try {
      const tracks = await getPlaylistTracks(playlist.id)
      setPlaylistTracks(tracks || [])
    } catch (err) {
      console.log("Could not load playlist tracks")
    } finally {
      setLoadingTracks(false)
    }
  }

  return (
    <div className="page">
      <Navbar />

      <ProgressCard progress={progress} />

      <div className="dashboard-grid">
        <div>
          <h2 className="section-title">Recently Played</h2>

          {recentlyPlayedSongs.map((song) => (
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

        <div>
          <Link to="/search" className="main-button wide-button">
            Begin New Song Lesson
          </Link>

          <h2 className="section-title">Recent Words</h2>

          {recentWords.map((item) => (
            <WordCard
              key={item.id}
              word={item.word}
              translation={item.translation || item.definition}
              songTitle={item.songTitle}
              dateAdded={item.dateAdded}
            />
          ))}

          {recentWords.length === 0 && (
            <p className = "page-text">No saved words yet</p>
          )}
        </div>
      </div>

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
    </div>
  );
}

export default Dashboard;
