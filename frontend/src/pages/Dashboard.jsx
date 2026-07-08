import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SongCard from '../components/SongCard'
import WordCard from '../components/WordCard'
import { mockSongs } from '../data/mockSongs'
import { mockWords } from '../data/mockWords'

function Dashboard() {
  const recentlyPlayedSongs = mockSongs.slice(0, 3)
  const recentWords = mockWords.slice(0, 2)

  return (
    <div className="page">
      <Navbar />

      <div className="dashboard-grid">
        <div>
          <h2 className="section-title">Recently Played</h2>

          {recentlyPlayedSongs.map((song) => (
            <SongCard
              key={song.id}
              title={song.title}
              artist={song.artist}
              language={song.language}
              coverUrl={song.coverUrl}
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
              definition={item.definition}
              songTitle={item.songTitle}
              dateAdded={item.dateAdded}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
