import spotify_client as sp


# Fake a logged-in Spotify session for the test client.
def _login(client):
  with client.session_transaction() as sess:
    sess["spotify_id"] = "u1"
    sess["user_id"] = 1
    sess["access_token"] = "token"


# Playlists are returned in the simplified shape the frontend expects.
def test_playlists_returns_simplified(app_ctx, monkeypatch):
  client = app_ctx.test_client()
  _login(client)

  fake = {
    "items": [
      {
        "id": "abc123",
        "name": "My Mix",
        "description": "d",
        "images": [{"url": "http://cover"}],
        "tracks": {"total": 12},
        "owner": {"display_name": "me"},
      }
    ]
  }
  monkeypatch.setattr(sp, "get_user_playlists", lambda token, **kwargs: fake)

  resp = client.get("/api/playlists")
  assert resp.status_code == 200

  playlist = resp.get_json()["playlists"][0]
  assert playlist["name"] == "My Mix"
  assert playlist["trackCount"] == 12


# A non-base62 playlist ID is rejected before any outbound request is made.
def test_playlist_tracks_rejects_bad_id(app_ctx):
  client = app_ctx.test_client()
  _login(client)
  assert client.get("/api/playlists/bad-id!/tracks").status_code == 400
