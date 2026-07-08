import { NavLink, Link } from 'react-router-dom'

function Navbar() {
    return (
        <nav className='navbar'>
            <div className="nav-brand">
                Linguify
            </div>

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

            <Link to ="/" className="nav-link">
                Logout
            </Link>

        </nav>
    )
}

export default Navbar