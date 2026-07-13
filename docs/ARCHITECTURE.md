# Architecture

## Overview

Linguify helps you learn a language through music you already listen to. It connects to
your Spotify account, pulls lyrics for a track, translates them line by line, and lets you
save words to review later as flashcards. In production a single Flask service serves the
built React app and exposes the JSON API under `/api`.

## Directory Layout

- `backend/app.py` - Flask app factory: config, CORS, session cookies, blueprint
  registration, and the SPA fallback that returns `index.html` for client-side routes.
- `backend/auth.py` - Spotify OAuth blueprint (`/api/login`, `/api/callback`, `/api/me`,
  `/api/logout`) and session management.
- `backend/routes.py` - Main API blueprint (search, recently played, lyrics, translate,
  word translation, and vocabulary CRUD).
- `backend/spotify_client.py` - Thin wrapper around the Spotify Web API (auth URLs, token
  exchange/refresh, search, recently played, and track simplification).
- `backend/services/` - Business logic that talks to third-party APIs and the database:
  - `lyrics_service.py` - fetch/caches lyrics from LRCLIB.
  - `translation_service.py` - translates lyrics/words via MyMemory and caches results.
  - `genius_service.py` - looks up song metadata from Genius.
- `backend/models.py` - SQLAlchemy models: `User`, `Song`, `Translation`, `Vocabulary`.
- `backend/extensions.py` - shared SQLAlchemy `db` instance.
- `backend/tests/` - pytest suite (mocks external HTTP calls).
- `frontend/` - React + Vite single-page app (`src/pages`, `src/components`,
  `src/services/api.js`).

## Request / Data Flow

During development the Vite dev server proxies `/api` calls to Flask on port 5000. In
production Flask serves the built React bundle directly.

```mermaid
flowchart TD
    Browser["Browser (React SPA)"]
    Proxy["Vite dev proxy /api (dev only)"]
    Flask["Flask app (app.py)"]
    AuthBp["auth_bp (auth.py)"]
    ApiBp["api_bp (routes.py)"]
    SpotifyClient["spotify_client.py"]
    Services["services/* (lyrics, translation, genius)"]
    DB[("Database (SQLite / Postgres)")]
    Spotify["Spotify Web API"]
    LRCLIB["LRCLIB"]
    MyMemory["MyMemory"]
    Genius["Genius"]

    Browser -->|"/api/* requests"| Proxy
    Proxy --> Flask
    Browser -->|"prod: same origin"| Flask
    Flask --> AuthBp
    Flask --> ApiBp
    AuthBp --> SpotifyClient
    ApiBp --> SpotifyClient
    ApiBp --> Services
    SpotifyClient --> Spotify
    Services --> LRCLIB
    Services --> MyMemory
    Services --> Genius
    AuthBp --> DB
    ApiBp --> DB
    Services --> DB
```

Notably, `_call_spotify` in [../backend/routes.py](../backend/routes.py) wraps Spotify
requests: if a call returns 400/401 (expired/invalid token) it refreshes the access token
once using the stored refresh token and retries.

## Spotify OAuth Flow

Implemented in [../backend/auth.py](../backend/auth.py). A random `state` value guards
against CSRF, and the session is populated only after the profile lookup succeeds.

```mermaid
sequenceDiagram
    participant User as Browser
    participant Flask
    participant Spotify

    User->>Flask: GET /api/login
    Flask->>Flask: generate state, store in session
    Flask-->>User: redirect to Spotify authorize URL
    User->>Spotify: log in and approve scopes
    Spotify-->>User: redirect to /api/callback?code&state
    User->>Flask: GET /api/callback
    Flask->>Flask: verify state matches session (CSRF check)
    Flask->>Spotify: exchange_code_for_token(code)
    Spotify-->>Flask: access_token + refresh_token
    Flask->>Spotify: get_user_profile(access_token)
    Spotify-->>Flask: profile
    Flask->>Flask: upsert User, set session (user_id, tokens, expiry)
    Flask-->>User: redirect to FRONTEND_URL/search
```

## Data Model

Defined in [../backend/models.py](../backend/models.py):

- `User` - one row per Spotify account (`spotify_id` unique). Owns vocabulary words.
- `Song` - a track with optional `spotify_track_id` / `genius_id`, plus cached `lyrics`.
- `Translation` - a song's lyrics translated into a target language. A unique constraint
  (`unique_song_language_translation`) ensures one translation per song per language, so
  results can be cached and reused.
- `Vocabulary` - a saved word belonging to a user, optionally linked to the song it came
  from.

```mermaid
erDiagram
    User ||--o{ Vocabulary : saves
    Song ||--o{ Translation : has
    Song ||--o{ Vocabulary : sourced_from

    User {
        int id PK
        string spotify_id
        string display_name
    }
    Song {
        int id PK
        string spotify_track_id
        string title
        string artist
        text lyrics
    }
    Translation {
        int id PK
        int song_id FK
        string target_language
        text translated_lyrics
    }
    Vocabulary {
        int id PK
        int user_id FK
        int song_id FK
        string word
        string translation
        string target_language
    }
```

## External APIs

- **Spotify Web API** - OAuth login, track search, and recently played. Wrapped in
  `spotify_client.py`.
- **LRCLIB** - plain/synced lyrics, fetched and cached by `lyrics_service.py`.
- **MyMemory** - line-by-line and single-word translation via `translation_service.py`.
  Translations are limited to the first 30 lines per song to stay within API limits.
- **Genius** - song metadata via `genius_service.py`.

## Auth and Session Notes

- Session cookies are configured in [../backend/app.py](../backend/app.py) with
  `HttpOnly`, `SameSite` (default `Lax`), and `Secure` (enabled in production over HTTPS).
- The OAuth `state` parameter is validated on callback to prevent CSRF.
- API routes require an authenticated session; requests without one return `401`.
- `DELETE /api/words/<id>` filters by `user_id` so a user can only delete their own words,
  preventing insecure direct object reference (IDOR).
