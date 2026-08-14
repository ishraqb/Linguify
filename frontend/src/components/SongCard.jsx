import { Link } from 'react-router-dom'
import Icon from './Icon'

// Solid sleeve colors for cover placeholders when a song has no album art.
const COVER_COLORS = ['#0d6e67', '#c45c12', '#3d5a80', '#6b4f3a', '#2f6b4f', '#1a1814']

function pickColor(seed) {
    let hash = 0
    for (const char of seed || '') {
        hash = (hash * 31 + char.charCodeAt(0)) >>> 0
    }
    return COVER_COLORS[hash % COVER_COLORS.length]
}

/** 
 * Reusable card for displaying a song result
 * Passes the selected song data to the next page when the user begins the lesson
 */
function SongCard({ id, title, artist, language, album, coverUrl, previewUrl, difficulty, explicit, linkTo = '/language-selection' }) {
    return (
        <div className="song-card">
            <div className="song-cover">
                {coverUrl ? (
                    <img src={coverUrl} alt={`${title} cover`} className="song-cover-img" />
                ) : (
                    <div className="song-cover-fallback" style={{ background: pickColor(`${title}${artist}`) }}>
                        <Icon name="music" size={30} strokeWidth={1.6} />
                    </div>
                )}
            </div>

            <div className="song-info">
                <h3>
                    {title}
                    {explicit && <span className="explicit-badge" title="Explicit">E</span>}
                </h3>
                <p>{artist}</p>
                {language && <p>{language}</p>}
                {difficulty && (
                    <span className={`difficulty-badge difficulty-${difficulty.toLowerCase()}`}>
                        {difficulty}
                    </span>
                )}
            </div>

            <Link 
                to={linkTo} 
                state={{
                    song : {
                        id, title, artist, album, coverUrl, previewUrl,
                    },
                }}
                className="secondary-button"
            >
                Start Lesson
            </Link>
        </div>
    )
}

export default SongCard