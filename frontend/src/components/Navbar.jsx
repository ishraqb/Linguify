import { NavLink, Link, useNavigate } from 'react-router-dom'
import { logout } from '../services/api'

/**
 * Reusable navigation bar for signed in users
 * Contains links to Dashboard, Search, My Words, and Logout
 */
function Navbar() {
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // Still send them home even if the session was already gone.
    }
    navigate('/')
  }

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

        <button type="button" className="nav-link nav-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar
