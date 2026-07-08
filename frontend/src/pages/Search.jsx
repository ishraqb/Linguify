import { Link } from 'react-router-dom'

function Search() {
  return (
    <div className="page">
      <div className="top-nav">
        <h1>Linguify</h1>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/search">Search</Link>
          <Link to="/my-words">My Words</Link>
        </div>
      </div>

      <h2 className="page-title">Search Songs</h2>
      <p className="page-text">
        Search for a song or choose from recently played tracks
      </p>

      <div className="search-box">
        <input
          className="search-input"
          type="text"
          placeholder="Search for a song"
        />
        <button className="secondary-button">Search</button>
      </div>

      <h3 className="section-title">Song Results</h3>

      <div className="song-card">
        <h3>Sample Song</h3>
        <p>Sample Artist</p>
        <p>Album: Sample Album</p>

        <Link to="/language-selection" className="main-button">
          Choose Song
        </Link>
      </div>
    </div>
  )
}

export default Search