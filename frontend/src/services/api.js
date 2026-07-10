const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

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

export async function getLyrics(song) {
    const params = new URLSearchParams({
        title: song.title,
        artist: song.artist
    })

    if (song.id) {
        params.append('spotify_track_id', song.id)
    }

    if (song.album) {
        params.append('album', song.album)
    }

    const response = await fetch(`${API_BASE_URL}/api/lyrics?${params}`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load lyrics")
    }

    return response.json()
}

export async function getTranslation(songId, sourceLanguage, targetLanguage) {
    const params = new URLSearchParams({
        song_id: songId,
        source_language: sourceLanguage,
        target_language: targetLanguage,
    })

    const response = await fetch(`${API_BASE_URL}/api/translate?${params}`, {
        credentials: 'include'
    })

    if (!response.ok) {
        throw new Error('Failed to translate lyrics')
    }

    return response.json()
}

export async function saveWord(wordData) {
    const response = await fetch(`${API_BASE_URL}/api/words`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(wordData),
    })

    if (!response.ok) {
        throw new Error("Failed to save word")
    }

    return response.json()
}

export async function getSavedWords() {
    const response = await fetch(`${API_BASE_URL}/api/words`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load saved words")
    }

    const data = await response.json()
    return data.words
}

export async function deleteWord(id) {
    const response = await fetch(`${API_BASE_URL}/api/words/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to delete word")
    }

    return response.json()
}
