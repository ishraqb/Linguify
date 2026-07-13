/** 
 * Central frontend API helper file
 * Each function sends a request to the Flask backend and returns JSON data to be used
 * Avoids have to duplicate fetch logic everywhere
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Searches Spotify songs by title or artist
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

// Gets the recently played songs in users Spotify
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

// Gets the synced lyrics for a selected song from the backend
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

// Gets the translated lyrics for a selected song using the soure & target language
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

// Saves a selected vocabulary word to the backend
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

// Loads all the user's saved words from the backend
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

// Gets a word translation for a specific tapped word
export async function getWordTranslation(word, sourceLanguage, targetLanguage) {
    const params = new URLSearchParams({
        word: word,
        source_language: sourceLanguage,
        target_language: targetLanguage
    })
    const response = await fetch(`${API_BASE_URL}/api/word-translation?${params}`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to translate word")
    }

    return response.json()
}

// Deletes the users saved word from the backend using the id
export async function deleteSavedWord(wordId) {
    const response = await fetch(`${API_BASE_URL}/api/words/${wordId}`, {
        method: 'DELETE',
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to delete saved word")
    }

    return response.json()
}
