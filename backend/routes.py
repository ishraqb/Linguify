import requests
from flask import Blueprint, session, request, jsonify

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
