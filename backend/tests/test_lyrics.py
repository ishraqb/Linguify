from services.lyrics_service import fetch_lyrics_from_lrclib


# Stub LRCLIB lyrics API response.
class MockResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return [
            {
                "plainLyrics": "Line one\nLine two",
                "syncedLyrics": None,
            }
        ]


# Stub LRCLIB response that includes timestamped (synced) lyrics.
class MockSyncedResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return [
            {
                "plainLyrics": "Line one\nLine two",
                "syncedLyrics": "[00:10.00] Line one\n[00:13.50] Line two",
            }
        ]


# fetch_lyrics_from_lrclib should return the plain lyrics text.
def test_fetch_lyrics_from_lrclib(monkeypatch):
    def mock_get(*args, **kwargs):
        return MockResponse()

    monkeypatch.setattr("services.lyrics_service.requests.get", mock_get)

    result = fetch_lyrics_from_lrclib("Test Song", "Test Artist")

    assert result["plain"] == "Line one\nLine two"
    assert result["synced"] is None


# fetch_lyrics_from_lrclib should also return synced (timestamped) lyrics when present.
def test_fetch_lyrics_from_lrclib_synced(monkeypatch):
    def mock_get(*args, **kwargs):
        return MockSyncedResponse()

    monkeypatch.setattr("services.lyrics_service.requests.get", mock_get)

    result = fetch_lyrics_from_lrclib("Test Song", "Test Artist")

    assert result["synced"] == "[00:10.00] Line one\n[00:13.50] Line two"