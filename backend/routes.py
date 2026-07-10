import requests
from flask import Blueprint, session, request, jsonify
from services.lyrics_service import get_or_fetch_lyrics
from services.genius_service import search_song_metadata
from services.translation_service import get_or_create_translation, translate_text
from models import Vocabulary
from extensions import db

import spotify_client as sp

api_bp = Blueprint("api", __name__)

def _refresh_session_token():
  new_tokens = sp.refresh_access_token(session["refresh_token"])
  session["access_token"] = new_tokens["access_token"]
  session["expires_at"] = sp.token_expiry_timestamp(new_tokens["expires_in"])
  if new_tokens.get("refresh_token"):
    session["refresh_token"] = new_tokens["refresh_token"]
  return session["access_token"]

def _call_spotify(make_request):
  try:
    return make_request(session.get("access_token"))
  except requests.HTTPError as e:
    if e.response is not None and e.response.status_code in (400, 401):
      return make_request(_refresh_session_token())
    raise

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

@api_bp.get("/api/recently-played")
def recently_played():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  data = _call_spotify(sp.get_recently_played)
  items = data.get("items", [])
  return jsonify(tracks=[sp.simplify_track(i.get("track")) for i in items])

@api_bp.get("/api/lyrics")
def get_lyrics():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  title = request.args.get("title", "").strip()
  artist = request.args.get("artist", "").strip()
  spotify_track_id = request.args.get("spotify_track_id", "").strip() or None
  album = request.args.get("album", "").strip() or None

  if not title or not artist:
    return jsonify(error="Missing title or artist"), 400
  result = get_or_fetch_lyrics(
    title=title,
    artist=artist,
    spotify_track_id=spotify_track_id,
    album=album,
  )
  if not result:
    return jsonify(error="Lyrics not found"), 404
  return jsonify(result)

@api_bp.get("/api/genius/search")
def genius_search():
  if "spotify_id" not in session:
    return jsonify(error="Not authenticated"), 401
  title = request.args.get("title", "").strip()
  artist = request.args.get("artist", "").strip()
  if not title or not artist:
    return jsonify(error="Missing title or artist"), 400
  try:
    metadata = search_song_metadata(title, artist)
  except RuntimeError as e:
    return jsonify(error="Genius API request failed"), 502
  if not metadata:
    return jsonify(error="Song metadata not found"), 404
  return jsonify(metadata)

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
    translated = translate_text(word, source_lang=source_language, target_lang=target_language)
    return jsonify({
      "word": word,
      "translation": translated or "Translation unavailable"
    })
  except requests.RequestException:
    return jsonify(error="Translation API request failed"), 502

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
