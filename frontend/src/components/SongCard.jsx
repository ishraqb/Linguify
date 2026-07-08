import { Link } from 'react-router-dom'

function SongCard({ title, artist, language, coverUrl, linkTo = '/language-selection' }) {
    return (
        <div className="song-card">
            <div className="song-cover">
                {coverUrl ? (
                    <img src={coverUrl} alt={`${title} cover`} className="song-cover-img" />
                ) : (
                    'Cover'
                )}
            </div>

            <div className="song-info">
                <h3>{title}</h3>
                <p>{artist}</p>
                {language && <p>{language}</p>}
            </div>

            <Link to={linkTo} className="secondary-button">
                Start Lesson
            </Link>
        </div>
    )
}

export default SongCard