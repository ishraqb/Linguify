import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SongCard from '../components/SongCard'
import WordCard from '../components/WordCard'
import { mockSongs } from '../data/mockSongs'
import { mockWords } from '../data/mockWords'
import { getRecentlyPlayedSongs, getSavedWords } from '../services/api'

/**
 * Dashboard view for signed in users
 * Displays their recently played songs and recently saved words
 */
function Dashboard() {
  const [recentlyPlayedSongs, setRecentlyPlayedSongs] = useState(mockSongs.slice(0, 3))
  const [recentWords, setRecentWords] = useState(mockWords.slice(0,2))

  // Loads in the recently played songs and recent saved words, validates it and checks for errors
  useEffect(() => {
    async function loadRecentlyPlayed() {
      try {
        const tracks = await getRecentlyPlayedSongs()
        if (tracks.length > 0) {
          setRecentlyPlayedSongs(tracks)
        }
      } catch (err) {
        console.log("Using mock recently played songs for now")
      }
    }

    async function loadRecentWords() {
      try {
        const savedWords = await getSavedWords()

        if (savedWords.length > 0) {
          setRecentWords(savedWords.slice(0, 2))
        }
      } catch (err) {
        console.log("Using mock recent words")
      }
    }

    loadRecentlyPlayed()
    loadRecentWords()
  }, [])
  
  return (
    <div className="page">
      <Navbar />

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
    </div>
  );
}

export default Dashboard;
