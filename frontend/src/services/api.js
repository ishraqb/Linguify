/** 
 * Central frontend API helper file
 * Each function sends a request to the Flask backend and returns JSON data to be used
 * Avoids have to duplicate fetch logic everywhere
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Gets a few popular catalog songs with cover art for the public landing page
export async function getPopularSongs() {
    const response = await fetch(`${API_BASE_URL}/api/popular`)

    if (!response.ok) {
        throw new Error("Failed to load popular songs")
    }

    const data = await response.json()

    return data.songs
}

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

// Searches YouTube videos by title or artist
export async function searchYoutube(query) {
    const response = await fetch(
        `${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(query)}`,
        {
            credentials: 'include',
        }
    )

    if (!response.ok) {
        throw new Error("Failed to search YouTube")
    }

    const data = await response.json()

    return data.videos
}

// Resolves a Spotify track ID from a title/artist so catalog songs without a
// stored ID can still use full-song playback. Returns null if none is found.
export async function resolveTrackId(title, artist) {
    const response = await fetch(
        `${API_BASE_URL}/api/track-id?title=${encodeURIComponent(title || '')}&artist=${encodeURIComponent(artist || '')}`,
        {
            credentials: 'include',
        }
    )

    if (!response.ok) return null

    const data = await response.json()

    return data.id || null
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

// Gets the user's saved preferences (e.g. hiding explicit tracks)
export async function getPreferences() {
    const response = await fetch(`${API_BASE_URL}/api/preferences`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load preferences")
    }

    return response.json()
}

// Updates the user's preferences and returns the saved values
export async function updatePreferences(prefs) {
    const response = await fetch(`${API_BASE_URL}/api/preferences`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(prefs),
    })

    if (!response.ok) {
        throw new Error("Failed to update preferences")
    }

    return response.json()
}

// Gets the user's gamification stats (XP, level, streak, daily goal)
export async function getProgress() {
    const response = await fetch(`${API_BASE_URL}/api/progress`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load progress")
    }

    return response.json()
}

// Records a learning activity ('word', 'song', or 'quiz') and returns updated stats
export async function recordActivity(type) {
    const response = await fetch(`${API_BASE_URL}/api/progress/activity`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ type }),
    })

    if (!response.ok) {
        throw new Error("Failed to record activity")
    }

    return response.json()
}

// Updates the user's daily words goal and returns updated stats
export async function updateDailyGoal(dailyGoal) {
    const response = await fetch(`${API_BASE_URL}/api/progress/goal`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ dailyGoal }),
    })

    if (!response.ok) {
        throw new Error("Failed to update daily goal")
    }

    return response.json()
}

// Gets the current user's own Spotify playlists
export async function getPlaylists() {
    const response = await fetch(`${API_BASE_URL}/api/playlists`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load playlists")
    }

    const data = await response.json()
    return data.playlists
}

// Gets the tracks inside one of the user's playlists
export async function getPlaylistTracks(playlistId) {
    const response = await fetch(`${API_BASE_URL}/api/playlists/${playlistId}/tracks`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load playlist tracks")
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

// Romanizes non-Latin lyric lines into readable Latin script, aligned by index
export async function getRomanization(lines, language) {
    const response = await fetch(`${API_BASE_URL}/api/romanize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ lines, language }),
    })

    if (!response.ok) {
        throw new Error("Failed to romanize lyrics")
    }

    const data = await response.json()
    return data.romanized
}

// Gets a 30s Deezer preview URL and album cover for a song
export async function getPreview(title, artist){
  const params = new URLSearchParams({ title, artist })

  const response = await fetch(`${API_BASE_URL}/api/preview?${params}`, {
    credentials: 'include',
  })

  if (!response.ok){
    throw new Error("Failed to load preview")
  }

  const data = await response.json()
  return { previewUrl: data.preview_url, coverUrl: data.cover_url }
}

// Backwards-compatible helper that returns just the preview URL
export async function getPreviewUrl(title, artist){
  const { previewUrl } = await getPreview(title, artist)
  return previewUrl
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
export async function getCloze(songId, language, targetLanguage) {
    const params = new URLSearchParams({ song_id: songId })
    if (language) {
        params.append('language', language)
    }
    if (targetLanguage) {
        params.append('target_language', targetLanguage)
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

// Builds a varied quiz (fill-in-the-blank, line translation, and word meaning)
// for a song. Falls back to fill-in-the-blank only when no target language.
export async function getQuiz(songId, language, targetLanguage) {
    const params = new URLSearchParams({ song_id: songId })
    if (language) {
        params.append('language', language)
    }
    if (targetLanguage) {
        params.append('target_language', targetLanguage)
    }

    const response = await fetch(`${API_BASE_URL}/api/quiz?${params}`, {
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

// Gets a word's direct translation plus its lyric line translated for context
export async function getWordContext(word, line, sourceLanguage, targetLanguage) {
    const params = new URLSearchParams({
        word,
        line: line || '',
        source_language: sourceLanguage,
        target_language: targetLanguage,
    })
    const response = await fetch(`${API_BASE_URL}/api/word-context?${params}`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load word context")
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

// Deletes every saved word for the logged-in user
export async function deleteAllSavedWords() {
    const response = await fetch(`${API_BASE_URL}/api/words`, {
        method: 'DELETE',
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to remove all saved words")
    }

    return response.json()
}

// Gets full learning detail for a word: meaning, base form, and an example sentence
export async function getWordDetail(word, sourceLanguage, targetLanguage) {
    const params = new URLSearchParams({
        word,
        source_language: sourceLanguage || '',
        target_language: targetLanguage || '',
    })
    const response = await fetch(`${API_BASE_URL}/api/word-detail?${params}`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error("Failed to load word detail")
    }

    return response.json()
}
