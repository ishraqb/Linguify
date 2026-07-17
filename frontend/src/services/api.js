/** 
 * Central frontend API helper file
 * Each function sends a request to the Flask backend and returns JSON data to be used
 * Avoids have to duplicate fetch logic everywhere
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Gets the current logged-in user's info, including their Spotify plan (product)
export async function getMe() {
    const response = await fetch(`${API_BASE_URL}/api/me`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load user info")
    }

    return response.json()
}

// Gets a valid Spotify access token for the Web Playback SDK
export async function getToken() {
    const response = await fetch(`${API_BASE_URL}/api/token`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load token")
    }

    const data = await response.json()
    return data.access_token
}

// Starts full-song playback of a track on the given SDK device (Premium)
export async function startPlayback(deviceId, trackId) {
    const response = await fetch(`${API_BASE_URL}/api/play`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ device_id: deviceId, track_id: trackId }),
    })

    if (!response.ok) {
        throw new Error("Failed to start playback")
    }

    return response.json()
}

// Browses the stored song catalog, filtered by language, difficulty, and text
export async function discoverSongs({ language, difficulty, q } = {}) {
    const params = new URLSearchParams()
    if (language) params.append('language', language)
    if (difficulty) params.append('difficulty', difficulty)
    if (q) params.append('q', q)

    const response = await fetch(`${API_BASE_URL}/api/discover?${params}`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load discovery")
    }

    return response.json()
}

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

    const coverUrl = song.coverUrl || song.albumArt
    if (coverUrl) {
        params.append('cover_url', coverUrl)
    }

    const response = await fetch(`${API_BASE_URL}/api/lyrics?${params}`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load lyrics")
    }

    return response.json()
}

// Gets a 30s Deezer preview URL for a song
export async function getPreviewUrl(title, artist){
  const params = new URLSearchParams({ title, artist })

  const response = await fetch(`${API_BASE_URL}/api/preview?${params}`, {
    credentials: 'include',
  })

  if (!response.ok){
    throw new Error("Failed to load preview")
  }

  const data = await response.json()
  return data.preview_url
}

// Detects the source language of a song from its lyrics
export async function detectLanguage(title, artist) {
    const params = new URLSearchParams({ title, artist })

    const response = await fetch(`${API_BASE_URL}/api/detect-language?${params}`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to detect language")
    }

    const data = await response.json()
    return data.language
}

// Gets a difficulty rating (level + score) for a song based on its lyrics
export async function getDifficulty(title, artist) {
    const params = new URLSearchParams({ title, artist })

    const response = await fetch(`${API_BASE_URL}/api/difficulty?${params}`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load difficulty")
    }

    const data = await response.json()
    return data.difficulty
}

// Gets fill-in-the-blank (cloze) quiz questions built from a song's lyrics
export async function getCloze(songId, language) {
    const params = new URLSearchParams({ song_id: songId })
    if (language) {
        params.append('language', language)
    }

    const response = await fetch(`${API_BASE_URL}/api/cloze?${params}`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load quiz")
    }

    const data = await response.json()
    return data.questions
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
