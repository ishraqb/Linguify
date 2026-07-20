/**
 * Responsive embedded YouTube player for the selected video
 */
function YouTubePlayer({ videoId, title }) {
    if (!videoId) return null

    return (
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
            <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={title || 'YouTube video player'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                }}
            />
        </div>
    )
}

export default YouTubePlayer
