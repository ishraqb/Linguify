import { Link } from 'react-router-dom'
import Icon from './Icon'

// Vibrant gradients used for cover placeholders when a song has no album art.
const COVER_GRADIENTS = [
    'linear-gradient(135deg, #16a89a, #0f8b80)',
    'linear-gradient(135deg, #f5901e, #ef6f1a)',
    'linear-gradient(135deg, #6c5ce7, #8e7bff)',
    'linear-gradient(135deg, #e0245e, #ff5c8a)',
    'linear-gradient(135deg, #2d9cdb, #57c1ff)',
    'linear-gradient(135deg, #27ae60, #5bd98a)',
]

// Pick a stable gradient from the song text so each card keeps its color.
function pickGradient(seed) {
    let hash = 0
    for (const char of seed || '') {
        hash = (hash * 31 + char.charCodeAt(0)) >>> 0
    }
    return COVER_GRADIENTS[hash % COVER_GRADIENTS.length]
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
                    <div className="song-cover-fallback" style={{ background: pickGradient(`${title}${artist}`) }}>
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