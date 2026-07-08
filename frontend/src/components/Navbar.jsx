import { NavLink, Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="top-nav">
      <h1>Linguify</h1>

      <div className="nav-links">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? 'nav-link active-nav-link' : 'nav-link'
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) =>
            isActive ? 'nav-link active-nav-link' : 'nav-link'
          }
        >
          Search
        </NavLink>

        <NavLink
          to="/my-words"
          className={({ isActive }) =>
            isActive ? 'nav-link active-nav-link' : 'nav-link'
          }
        >
          My Words
        </NavLink>

        <Link to="/" className="nav-link">
          Logout
        </Link>
      </div>
    </nav>
  )
}

export default Navbar