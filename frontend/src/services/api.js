const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function searchSongs(query) {
    const response = await fetch(
        `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`,
        {
            credentials: 'include',
        }
    )

    if (!response.ok) {
        throw new Error("Failed to search songs")
    }

    const data = await response.json()

    return data.tracks
}

export async function getRecentlyPlayedSongs() {
    const response = await fetch(`${API_BASE_URL}/api/recently-played`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load recently played songs")
    }

    const data = await response.json()

    return data.tracks
}