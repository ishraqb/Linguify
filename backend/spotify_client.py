import os
import time
import base64
from urllib.parse import urlencode

import requests

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE = "https://api.spotify.com/v1"

SCOPES = "user-read-recently-played user-read-email"


def _client_id():
  return os.environ["SPOTIFY_CLIENT_ID"]

def _client_secret():
  return os.environ["SPOTIFY_CLIENT_SECRET"]

def _redirect_uri():
  return os.environ["SPOTIFY_REDIRECT_URI"]

def _basic_auth_header():
  creds = f"{_client_id()}:{_client_secret()}".encode()
  return {"Authorization": "Basic " + base64.b64encode(creds).decode()}

def build_authorize_url(state):
  params = {
    "client_id": _client_id(),
    "response_type": "code",
    "redirect_uri": _redirect_uri(),
    "scope": SCOPES,
    "state": state,
  }
  return f"{SPOTIFY_AUTH_URL}?{urlencode(params)}"

def exchange_code_for_token(code):
  resp = requests.post(
    SPOTIFY_TOKEN_URL,
    data={
      "grant_type": "authorization_code",
      "code": code,
      "redirect_uri": _redirect_uri(),
    },
    headers=_basic_auth_header(),
    timeout=10,
  )
  resp.raise_for_status()
  return resp.json()

def refresh_access_token(refresh_token):
  resp = requests.post(
    SPOTIFY_TOKEN_URL,
    data={"grant_type": "refresh_token", "refresh_token": refresh_token},
    headers=_basic_auth_header(),
    timeout=10,
  )
  resp.raise_for_status()
  return resp.json()

def get_user_profile(access_token):
  resp = requests.get(
    f"{SPOTIFY_API_BASE}/me",
    headers={"Authorization": f"Bearer {access_token}"},
    timeout=10,
  )
  resp.raise_for_status()
  return resp.json()

def token_expiry_timestamp(expires_in, now=None):
  now = now if now is not None else time.time()
  return now + expires_in

def is_token_expired(expires_at, now=None):
  now = now if now is not None else time.time()
  return now >= (expires_at - 60)

def search_tracks(access_token, query, limit=10):
  resp = requests.get(
    f"{SPOTIFY_API_BASE}/search",
    headers={"Authorization": f"Bearer {access_token}"},
    params={"q": query, "type": "track", "limit": limit},
    timeout=10,
  )
  resp.raise_for_status()
  return resp.json()

def get_recently_played(access_token, limit=20):
  resp = requests.get(
    f"{SPOTIFY_API_BASE}/me/player/recently-played",
    headers={"Authorization": f"Bearer {access_token}"},
    params={"limit": limit},
    timeout=10
  )
  resp.raise_for_status()
  return resp.json()

def simplify_track(track):
  if not track:
    return None
  
  album = track.get("album", {})
  images = album.get("images", [])
  cover_url = images[0].get("url", "") if images else ""

  return{
    "id": track.get("id"),
    "title": track.get("name"),
    "name": track.get("name"),
    "artist": ", ".join(a.get("name", "") for a in track.get("artists", [])),
    "album": album.get("name"),
    "language": "",
    "coverUrl": cover_url,
    "albumArt": cover_url,
    "previewUrl": track.get("preview_url"),
    "preview_url": track.get("preview_url"),
  }