import re
import requests
from flask import Blueprint, session, request, jsonify
from services.lyrics_service import get_or_fetch_lyrics
from services.translation_service import get_or_create_translation, get_or_create_word_translation, translate_text
from services.deezer_service import get_preview_url, get_track_media
from services.language_service import detect_language
from services.difficulty_service import compute_difficulty
from services.cloze_service import generate_cloze_questions
from services.discovery_service import discover_songs, available_languages, popular_songs
from services.charts_service import international_top
from services.romanization_service import romanize_lines, needs_romanization
from services.youtube_service import search_videos, simplify_video
from services.progress_service import (
  get_or_create_progress,
  record_activity,
  set_daily_goal,
  serialize_progress,
  ALLOWED_ACTIVITIES,
)
from models import Vocabulary, Song, User
from extensions import db

import spotify_client as sp

api_bp = Blueprint("api", __name__)

# Use the stored refresh token to get a fresh access token and update the session.
def _refresh_session_token():
  new_tokens = sp.refresh_access_token(session["refresh_token"])
  session["access_token"] = new_tokens["access_token"]
  session["expires_at"] = sp.token_expiry_timestamp(new_tokens["expires_in"])
  if new_tokens.get("refresh_token"):
    session["refresh_token"] = new_tokens["refresh_token"]
  return session["access_token"]

# Call Spotify; if the token is rejected (400/401), refresh once and retry.
def _call_spotify(make_request):
  try:
    return make_request(session.get("access_token"))
  except requests.HTTPError as e:
    if e.response is not None and e.response.status_code in (400, 401):
      return make_request(_refresh_session_token())
    raise

# Drop explicit tracks from a simplified-track list when the user has opted out.
def _filter_explicit(tracks):
  if not session.get("hide_explicit"):
    return tracks
  return [t for t in tracks if t and not t.get("explicit")]

# GET /api/search - search Spotify tracks for the query string 'q'.
@api_bp.get("/api/search")
def search():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  query = request.args.get("q", "").strip()
  if not query:
    return jsonify(error="Missing query parameter 'q'"), 400
  data = _call_spotify(lambda token: sp.search_tracks(token, query))
  items = data.get("tracks", {}).get("items", [])
  return jsonify(tracks=_filter_explicit([sp.simplify_track(t) for t in items]))

# GET /api/recently-played - return the user's recently played tracks.
@api_bp.get("/api/recently-played")
def recently_played():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  data = _call_spotify(sp.get_recently_played)
  items = data.get("items", [])
  tracks = [sp.simplify_track(i.get("track")) for i in items]
  return jsonify(tracks=_filter_explicit([t for t in tracks if t]))

# GET /api/playlists - return the user's own Spotify playlists.
@api_bp.get("/api/playlists")
def playlists():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  data = _call_spotify(sp.get_user_playlists)
  items = data.get("items", [])
  return jsonify(playlists=[sp.simplify_playlist(p) for p in items if p])

# GET /api/playlists/<playlist_id>/tracks - return the tracks in one of the user's playlists.
@api_bp.get("/api/playlists/<playlist_id>/tracks")
def playlist_tracks(playlist_id):
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  # Allow only Spotify's base62 IDs so user input can't be injected into the outbound URL (SSRF/path-traversal guard).
  if not re.fullmatch(r"[A-Za-z0-9]+", playlist_id):
    return jsonify(error="Invalid playlist_id"), 400
  data = _call_spotify(lambda token: sp.get_playlist_tracks(token, playlist_id))
  items = data.get("items", [])
  # Feb 2026 API renamed each entry's "track" field to "item".
  tracks = [sp.simplify_track(i.get("item") or i.get("track")) for i in items]
  return jsonify(tracks=[t for t in tracks if t])

# GET /api/preview - fetch 30s preview URL + album cover from Deezer for a title/artist
@api_bp.get("/api/preview")
def get_preview():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  title = request.args.get("title", "").strip()
  artist = request.args.get("artist", "").strip()
  if not title or not artist:
    return jsonify(error="Missing title or artist"), 400
  try:
    media = get_track_media(title, artist)
  except requests.RequestException:
    media = {"preview_url": None, "cover_url": None}
  return jsonify(preview_url=media.get("preview_url"), cover_url=media.get("cover_url"))

# GET /api/youtube/search - search YouTube videos for the query string 'q'.
@api_bp.get("/api/youtube/search")
def search_youtube():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  query = request.args.get("q", "").strip()
  if not query:
    return jsonify(error="Missing query parameter 'q'"), 400
  try:
    data = search_videos(query, limit=10)
  except requests.HTTPError:
    return jsonify(error="YouTube search failed"), 502
  items = data.get("items", [])
  return jsonify(videos=[simplify_video(item) for item in items])

# GET /api/token - return the current Spotify access token for the Web Playback SDK.
@api_bp.get("/api/token")
def get_token():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  # Refresh first if the stored token is expired so the SDK always gets a valid one.
  if sp.is_token_expired(session.get("expires_at", 0)):
    _refresh_session_token()
  return jsonify(access_token=session.get("access_token"))

# PUT /api/play - start playing a track on the given Web Playback SDK device (Premium only).
@api_bp.put("/api/play")
def play_track():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  data = request.get_json() or {}
  device_id = (data.get("device_id") or "").strip()
  track_id = (data.get("track_id") or "").strip()
  if not device_id or not track_id:
    return jsonify(error="Missing device_id or track_id"), 400
  # Allow only Spotify's base62 track IDs so we never build a URI from unchecked input.
  if not re.fullmatch(r"[A-Za-z0-9]+", track_id):
    return jsonify(error="Invalid track_id"), 400
  try:
    _call_spotify(lambda token: sp.start_playback(token, device_id, track_id))
  except requests.HTTPError:
    # Keep Spotify's detailed error server-side; return a generic message to the client.
    return jsonify(error="Playback could not be started"), 502
  return jsonify(status="playing")

# GET /api/lyrics - fetch (or look up cached) lyrics for a title/artist.
@api_bp.get("/api/lyrics")
def get_lyrics():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  title = request.args.get("title", "").strip()
  artist = request.args.get("artist", "").strip()
  spotify_track_id = request.args.get("spotify_track_id", "").strip() or None
  album = request.args.get("album", "").strip() or None
  cover_url = request.args.get("cover_url", "").strip() or None

  if not title or not artist:
    return jsonify(error="Missing title or artist"), 400
  result = get_or_fetch_lyrics(
    title=title,
    artist=artist,
    spotify_track_id=spotify_track_id,
    album=album,
    cover_url=cover_url,
  )
  if not result:
    return jsonify(error="Lyrics not found"), 404
  return jsonify(result)

# GET /api/detect-language - detect the source language of a song's lyrics.
@api_bp.get("/api/detect-language")
def detect_song_language():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  title = request.args.get("title", "").strip()
  artist = request.args.get("artist", "").strip()
  if not title or not artist:
    return jsonify(error="Missing title or artist"), 400
  result = get_or_fetch_lyrics(title=title, artist=artist)
  if not result:
    return jsonify(error="Lyrics not found"), 404
  return jsonify(language=detect_language(result.get("lyrics")))

# GET /api/difficulty - rate how hard a song's lyrics are from word frequency.
@api_bp.get("/api/difficulty")
def song_difficulty():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  title = request.args.get("title", "").strip()
  artist = request.args.get("artist", "").strip()
  language = request.args.get("language", "").strip() or None
  if not title or not artist:
    return jsonify(error="Missing title or artist"), 400
  result = get_or_fetch_lyrics(title=title, artist=artist)
  if not result:
    return jsonify(error="Lyrics not found"), 404
  lyrics = result.get("lyrics")
  # Fall back to detecting the language when the caller doesn't supply one.
  language = language or detect_language(lyrics) or "en"
  return jsonify(difficulty=compute_difficulty(lyrics, language))

# GET /api/discover - browse the song catalog filtered by language and difficulty.
@api_bp.get("/api/discover")
def discover():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  language = request.args.get("language", "").strip() or None
  difficulty = request.args.get("difficulty", "").strip() or None
  query = request.args.get("q", "").strip() or None
  songs = discover_songs(
    language=language,
    difficulty=difficulty,
    query=query,
    include_explicit=not session.get("hide_explicit"),
  )
  return jsonify(songs=songs, languages=available_languages())

# GET /api/popular - current international top songs for the public landing page.
# Intentionally public (no auth): returns only non-sensitive display fields.
# Falls back to a random catalog sample if the charts source is unavailable.
@api_bp.get("/api/popular")
def popular():
  songs = international_top()
  if not songs:
    songs = popular_songs()
  return jsonify(songs=songs)

# GET /api/preferences - return the user's saved preferences.
@api_bp.get("/api/preferences")
def get_preferences():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  return jsonify(hideExplicit=bool(session.get("hide_explicit")))

# PUT /api/preferences - update the user's preferences (currently the explicit filter).
@api_bp.put("/api/preferences")
def update_preferences():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  data = request.get_json() or {}
  hide_explicit = bool(data.get("hideExplicit"))
  user = db.session.get(User, session.get("user_id"))
  if user:
    user.hide_explicit = hide_explicit
    db.session.commit()
  session["hide_explicit"] = hide_explicit
  return jsonify(hideExplicit=hide_explicit)

# POST /api/romanize - transliterate non-Latin lyric lines into readable Latin script.
@api_bp.post("/api/romanize")
def romanize():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  data = request.get_json() or {}
  lines = data.get("lines") or []
  language = (data.get("language") or "").strip()
  if not isinstance(lines, list):
    return jsonify(error="lines must be a list"), 400
  # Keep only strings so the transliterator never receives unexpected types.
  lines = [line for line in lines if isinstance(line, str)]
  return jsonify(
    romanized=romanize_lines(lines, language),
    needed=needs_romanization(language),
  )

# GET /api/cloze - build fill-in-the-blank questions from a song's lyrics.
@api_bp.get("/api/cloze")
def cloze_quiz():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  song_id = request.args.get("song_id", type=int)
  language = request.args.get("language", "en").strip() or "en"
  if not song_id:
    return jsonify(error="Missing song_id"), 400
  song = Song.query.get(song_id)
  if not song or not song.lyrics:
    return jsonify(error="Song or lyrics not found"), 404
  questions = generate_cloze_questions(song.lyrics, language=language)
  return jsonify(questions=questions)

# GET /api/translate - translate a full song's lyrics into the target language.
@api_bp.get("/api/translate")
def translate_song():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401

  song_id = request.args.get("song_id", type=int)
  target_language = request.args.get("target_language", "").strip()
  source_language = request.args.get("source_language", "en").strip()
  
  if not song_id or not target_language or not source_language:
    return jsonify(error="Missing song_id, target_language, or source_language"), 400
  try:
    result = get_or_create_translation(
      song_id=song_id,
      target_language=target_language,
      source_language=source_language,
    )
  except requests.HTTPError:
    return jsonify(error="Translation API request failed"), 502
  if not result:
    return jsonify(error="Song or lyrics not found"), 404
  return jsonify(result)

# GET /api/word-translation - translate a single word on demand.
@api_bp.get("/api/word-translation")
def translate_word():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  
  target_language = request.args.get("target_language", "").strip()
  source_language = request.args.get("source_language", "en").strip()
  word = request.args.get("word", "").strip()
  
  if not word or not target_language or not source_language:
    return jsonify(error="Missing target_language, source_language, or word"), 400
  try:
    translated = get_or_create_word_translation(word, source_language, target_language)
    return jsonify({
      "word": word,
      "translation": translated or "Translation unavailable"
    })
  except requests.RequestException:
    return jsonify(error="Translation API request failed"), 502

# GET /api/word-context - translate a word plus its whole lyric line for casual/slang usage.
@api_bp.get("/api/word-context")
def word_context():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401

  word = request.args.get("word", "").strip()
  line = request.args.get("line", "").strip()
  source_language = request.args.get("source_language", "en").strip()
  target_language = request.args.get("target_language", "").strip()

  if not word or not target_language or not source_language:
    return jsonify(error="Missing word, source_language, or target_language"), 400
  try:
    direct = get_or_create_word_translation(word, source_language, target_language)
    # Translating the full line shows how the word is actually used in context.
    contextual = translate_text(line, source_lang=source_language, target_lang=target_language) if line else ""
  except requests.RequestException:
    return jsonify(error="Translation API request failed"), 502
  return jsonify({
    "word": word,
    "translation": direct or "Translation unavailable",
    "line": line,
    "contextual": contextual or "",
  })

# POST /api/words - save a vocabulary word for the logged-in user.
@api_bp.post("/api/words")
def save_word():
  if "user_id" not in session:
    return jsonify(error="Not authenticated"), 401

  data = request.get_json() or {}

  word = data.get("word", "").strip()
  translation = data.get("translation", "").strip()
  target_language = data.get("target_language", "").strip()
  song_id = data.get("song_id")
  example_sentence = data.get("example_sentence")
  pronunciation = data.get("pronunciation")

  if not word or not translation or not target_language:
    return jsonify(error="Missing word, translation, or target_language"), 400

  vocab_word = Vocabulary(
    user_id=session["user_id"],
    song_id=song_id,
    word=word,
    translation=translation,
    target_language=target_language,
    example_sentence=example_sentence,
    pronunciation=pronunciation,
  )

  db.session.add(vocab_word)
  db.session.commit()

  # Saving a word counts toward XP, the daily goal, and the streak.
  record_activity(session["user_id"], "word")

  song_title = None
  if vocab_word.song:
    song_title = vocab_word.song.title

  return jsonify({
    "id": vocab_word.id,
    "word": vocab_word.word,
    "translation": vocab_word.translation,
    "definition": vocab_word.translation,
    "targetLanguage": vocab_word.target_language,
    "exampleSentence": vocab_word.example_sentence,
    "pronunciation": vocab_word.pronunciation,
    "songTitle": song_title,
    "dateAdded": vocab_word.created_at.strftime("%Y-%m-%d"),
  }), 201

# GET /api/words - return the user's saved vocabulary, newest first.
@api_bp.get("/api/words")
def get_words():
  if "user_id" not in session:
    return jsonify(error="Not authenticated"), 401

  vocab_words = (
    Vocabulary.query
    .filter_by(user_id=session["user_id"])
    .order_by(Vocabulary.created_at.desc())
    .all()
  )

  return jsonify(words=[
    {
      "id": item.id,
      "word": item.word,
      "translation": item.translation,
      "definition": item.translation,
      "targetLanguage": item.target_language,
      "exampleSentence": item.example_sentence,
      "pronunciation": item.pronunciation,
      "songTitle": item.song.title if item.song else "",
      "dateAdded": item.created_at.strftime("%Y-%m-%d"),
    }
    for item in vocab_words
  ])
  
# DELETE /api/words/<id> - remove one of the user's saved words.
@api_bp.delete("/api/words/<int:word_id>")
def delete_word(word_id):
  if "user_id" not in session:
    return jsonify(error="Not authenticated"), 401

  # Ownership filter (user_id) prevents deleting another user's word (IDOR).
  word = Vocabulary.query.filter_by(id=word_id, user_id=session["user_id"]).first()
  if not word:
    return jsonify(error="Word not found"), 404

  db.session.delete(word)
  db.session.commit()
  return jsonify(status="deleted", id=word_id)

# GET /api/progress - return the user's gamification stats (XP, level, streak, daily goal).
@api_bp.get("/api/progress")
def get_progress():
  if "user_id" not in session:
    return jsonify(error="Not authenticated"), 401
  progress = get_or_create_progress(session["user_id"])
  return jsonify(serialize_progress(progress, session["user_id"]))

# POST /api/progress/activity - record a learning activity and return updated stats.
@api_bp.post("/api/progress/activity")
def post_activity():
  if "user_id" not in session:
    return jsonify(error="Not authenticated"), 401
  data = request.get_json() or {}
  activity_type = (data.get("type") or "").strip()
  # Allow-list the activity type so callers can't invent XP sources.
  if activity_type not in ALLOWED_ACTIVITIES:
    return jsonify(error="Invalid activity type"), 400
  progress = record_activity(session["user_id"], activity_type)
  return jsonify(serialize_progress(progress, session["user_id"]))

# PUT /api/progress/goal - update the user's daily words goal.
@api_bp.put("/api/progress/goal")
def put_goal():
  if "user_id" not in session:
    return jsonify(error="Not authenticated"), 401
  data = request.get_json() or {}
  goal = data.get("dailyGoal")
  if goal is None:
    return jsonify(error="Missing dailyGoal"), 400
  try:
    progress = set_daily_goal(session["user_id"], goal)
  except (TypeError, ValueError):
    return jsonify(error="dailyGoal must be a number"), 400
  return jsonify(serialize_progress(progress, session["user_id"]))
