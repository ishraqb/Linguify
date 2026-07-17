import re
import requests
from flask import Blueprint, session, request, jsonify
from services.lyrics_service import get_or_fetch_lyrics
from services.translation_service import get_or_create_translation, get_or_create_word_translation
from services.deezer_service import get_preview_url
from services.language_service import detect_language
from services.difficulty_service import compute_difficulty
from services.cloze_service import generate_cloze_questions
from services.discovery_service import discover_songs, available_languages
from models import Vocabulary, Song
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
  return jsonify(tracks=[sp.simplify_track(t) for t in items])

# GET /api/recently-played - return the user's recently played tracks.
@api_bp.get("/api/recently-played")
def recently_played():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  data = _call_spotify(sp.get_recently_played)
  items = data.get("items", [])
  return jsonify(tracks=[sp.simplify_track(i.get("track")) for i in items])

# GET /api/preview - fetch 30s preview URL from Deezer for a title/artist
@api_bp.get("/api/preview")
def get_preview():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  title = request.args.get("title", "").strip()
  artist = request.args.get("artist", "").strip()
  if not title or not artist:
    return jsonify(error="Missing title or artist"), 400
  return jsonify(preview_url=get_preview_url(title, artist))

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
  songs = discover_songs(language=language, difficulty=difficulty, query=query)
  return jsonify(songs=songs, languages=available_languages())

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
