import Navbar from '../components/Navbar'
import SongCard from '../components/SongCard'

function Search() {
  return (
    <div className="page">
      <Navbar />

      <h2 className="section-title">Search Header</h2>

      <div className="search-box">
        <input
          className="search-input"
          type="text"
          placeholder="Search for a song"
        />
        <button className="secondary-button">Search</button>
      </div>

      <div className="section-row">
        <h2 className="section-title">Recently Played Header</h2>
        <button className="secondary-button">Show all</button>
      </div>

      <SongCard
        title="DÁKITI"
        artist="Bad Bunny, Jhay Cortez"
        language="Spanish"
      />

      <SongCard
        title="Despacito"
        artist="Luis Fonsi"
        language="Spanish"
      />
    </div>
  )
}

export default Search