import { NavLink, Link } from 'react-router-dom'

/**
 * Reusable navigation bar for signed in users
 * Contains links to Dashboard, Search, My Words, and Logout
 */
function Navbar() {
  return (
    <nav className="top-nav">
      <Link to="/dashboard" className="brand">
        <img src="/logo-mark.png" alt="Linguify logo" className="brand-mark" />
        <h1>Linguify</h1>
      </Link>

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
          Songs
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