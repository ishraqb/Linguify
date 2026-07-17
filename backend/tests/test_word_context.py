import routes


# Fake a logged-in Spotify session for the test client.
def _login(client):
  with client.session_transaction() as sess:
    sess["spotify_id"] = "u1"
    sess["user_id"] = 1


# word-context returns the direct word translation plus the whole line translated.
def test_word_context_returns_direct_and_contextual(app_ctx, monkeypatch):
  client = app_ctx.test_client()
  _login(client)

  monkeypatch.setattr(routes, "get_or_create_word_translation", lambda w, s, t: "casa")
  monkeypatch.setattr(routes, "translate_text", lambda text, source_lang, target_lang: f"[{text}]")

  resp = client.get(
    "/api/word-context",
    query_string={"word": "house", "line": "my house is big", "source_language": "en", "target_language": "es"},
  )
  assert resp.status_code == 200

  data = resp.get_json()
  assert data["translation"] == "casa"
  assert data["contextual"] == "[my house is big]"


# A missing word is rejected.
def test_word_context_requires_word(app_ctx):
  client = app_ctx.test_client()
  _login(client)
  resp = client.get("/api/word-context", query_string={"source_language": "en", "target_language": "es"})
  assert resp.status_code == 400
