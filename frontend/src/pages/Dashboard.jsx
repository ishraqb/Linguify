import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SongCard from '../components/SongCard'
import WordCard from '../components/WordCard'

function Dashboard() {
  return (
    <div className="page">
      <Navbar />

      <div className="dashboard-grid">
        <div>
          <h2 className="section-title">Recently Played List</h2>

          <SongCard title="DÁKITI" artist="Bad Bunny" />
          <SongCard title="Despacito" artist="Luis Fonsi" />
          <SongCard title="Tití Me Preguntó" artist="Bad Bunny" />
        </div>

        <div>
          <Link to="/search" className="main-button wide-button">
            Begin New Song Lesson
          </Link>

          <h2 className="section-title">Recent Words</h2>

          <WordCard
            word="contigo"
            definition="with you"
            songTitle="DÁKITI"
            dateAdded="Today"
          />

          <WordCard
            word="estrellas"
            definition="stars"
            songTitle="DÁKITI"
            dateAdded="Today"
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard