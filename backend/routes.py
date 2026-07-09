import requests
from flask import Blueprint, session, request, jsonify
from services.lyrics_service import get_or_fetch_lyrics
from services.genius_service import search_song_metadata
from services.translation_service import get_or_create_translation

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
  source_language = request.args.get("source_language", "auto").strip()
  if not song_id or not target_language:
    return jsonify(error="Missing song_id or target_language"), 400
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