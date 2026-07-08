import { Link } from 'react-router-dom'

function Navbar() {
    return (
        <nav className='navbar'>
            <div className="nav-brand">
                Linguify
            </div>

            <div className='nav-links'>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/search">Search</Link>
                <Link to="/my-words">My Words</Link>
                <Link to="/">Log Out</Link>
            </div>
        </nav>
    )
}

export default Navbar