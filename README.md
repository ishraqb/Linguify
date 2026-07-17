# Linguify

Learn a language through the music you already listen to. Linguify connects to your
Spotify account, pulls lyrics for a track, translates them line by line, and lets you
save words to review later as flashcards.

## Tech Stack

- **Frontend:** React + Vite, React Router, Bootstrap
- **Backend:** Flask, Flask-SQLAlchemy, Flask-CORS
- **Database:** SQLite (local dev), Postgres (production)
- **External APIs:** Spotify Web API (auth + search + recently played), LRCLIB (lyrics), Deezer (30s previews), DeepL (translation, preferred) with MyMemory fallback
- **Deploy:** Render (Flask serves the built React app as a single service)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for an architecture overview and diagrams.

## Prerequisites

- A Spotify Developer app (Client ID + Secret): https://developer.spotify.com/dashboard
- In the Spotify app settings, add your Redirect URI (see below). It must match **exactly**.

## Features

- Spotify authentication
- Search songs using Spotify
- View song lyrics
- Translate lyrics into another language
- Interactive and personalized vocabulary card deck
- Save words for review

## Future Add-Ons
- Multiple translation
- Word pronounciation
- Additional practice exercises


## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # then fill in the values (see below)
python app.py                      # runs on port 5000
```

### Environment Variables (`backend/.env`)

- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — from your Spotify dashboard
- `SPOTIFY_REDIRECT_URI` — must match a Redirect URI registered in Spotify, e.g. `https://<YOUR-BOX>-5000.codio.io/api/callback`
- `FRONTEND_URL` — where the backend redirects after login, e.g. `https://<YOUR-BOX>-5173.codio.io`
- `FLASK_SECRET_KEY` — generate with `python -c "import secrets; print(secrets.token_hex(32))"`
- `SESSION_COOKIE_SAMESITE` — `Lax` for local dev
- `SESSION_COOKIE_SECURE` — `false` locally, `true` in production (HTTPS)
- `DEEPL_API_KEY` *(optional)* — free key from the [DeepL API](https://www.deepl.com/pro-api) for higher-quality translation; falls back to MyMemory when unset or unsupported

> Never commit your real `.env`. Only `.env.example` (with placeholders) is tracked.

### Songs catalog

The **Songs** tab lets you browse by language and difficulty or search Spotify live.
Each song stores its language, difficulty, and cover art. Difficulty is filled in the
first time a song is studied; language and cover art are set when the catalog is seeded.

To populate a rich, cover-rich catalog across all supported languages, run once:

```bash
python seed_songs.py
```

This reads the curated per-language lists in `data/catalog_songs.py`, looks each song up
on Spotify (using your `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`) to attach cover art
and a track ID, and also backfills covers for any existing songs missing them.

> Spotify's own editorial playlists (Top 50, etc.) are no longer accessible via the API
> for development apps, so the catalog is built from curated song lists + Spotify search.

> If you have an existing `linguify.db` from before this feature, delete it once so the
> new song columns are created (`python app.py` rebuilds it on startup).

Lyrics come from **LRCLIB** first, then fall back to the **`syncedlyrics`** providers
(NetEase, Megalobiz, and others) for broader coverage. When no source has lyrics, the
lesson shows a clear "couldn't find lyrics" message instead of demo lyrics.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open: `https://<YOUR-BOX>-<PORT>.codio.io/`

- `PORT` = the port shown by `npm run dev` (default 5173)
- `<YOUR-BOX>` = run `echo $CODIO_HOSTNAME` in your terminal

Remove the brackets when typing your URL. The Vite dev server proxies `/api` requests to
the Flask backend on port 5000, so run both servers at once during development.

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/health` | Health check |
| GET | `/login` | Start Spotify login |
| GET | `/api/callback` | Spotify OAuth redirect handler |
| GET | `/api/me` | Current logged-in user |
| POST | `/logout` | Clear session |
| GET | `/api/search?q=` | Search Spotify tracks |
| GET | `/api/recently-played` | User's recently played tracks |
| GET | `/api/lyrics?title=&artist=` | Fetch lyrics |
| GET | `/api/translate?song_id=&source_language=&target_language=` | Translate lyrics |
| POST | `/api/words` | Save a vocabulary word |
| GET | `/api/words` | List saved words |
| DELETE | `/api/words/<id>` | Delete a saved word (owner only) |

## Running Tests

```bash
cd backend
source venv/bin/activate
pytest
```

## Deployment (Render)

The Flask service serves the built React app as a single web service.

- **Build command:** `cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt`
- **Start command:** `cd backend && gunicorn app:app`
- Set all backend environment variables in the Render dashboard.
- Set `SPOTIFY_REDIRECT_URI` and `FRONTEND_URL` to your Render URL, and register the redirect URI in the Spotify dashboard.
