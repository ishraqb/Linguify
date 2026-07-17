import requests
from services.lyrics_service import fetch_lyrics, fetch_lyrics_from_lrclib, parse_synced_lyrics


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


# fetch_lyrics should fall back to syncedlyrics when LRCLIB has nothing.
def test_fetch_lyrics_falls_back_to_syncedlyrics(monkeypatch):
    def mock_get(*args, **kwargs):
        raise requests.RequestException("lrclib down")

    def mock_search(term, *args, **kwargs):
        return "[00:10.00] Fallback line\n[00:13.50] Second line"

    monkeypatch.setattr("services.lyrics_service.requests.get", mock_get)
    monkeypatch.setattr("services.lyrics_service.syncedlyrics.search", mock_search)

    result = fetch_lyrics("Test Song", "Test Artist")

    assert result["synced"].startswith("[00:10.00]")
    assert result["plain"] == "Fallback line\nSecond line"


# fetch_lyrics should prefer LRCLIB and not call the fallback when it succeeds.
def test_fetch_lyrics_prefers_lrclib(monkeypatch):
    def mock_get(*args, **kwargs):
        return MockResponse()

    def mock_search(term, *args, **kwargs):
        raise AssertionError("fallback should not be used when LRCLIB succeeds")

    monkeypatch.setattr("services.lyrics_service.requests.get", mock_get)
    monkeypatch.setattr("services.lyrics_service.syncedlyrics.search", mock_search)

    result = fetch_lyrics("Test Song", "Test Artist")

    assert result["plain"] == "Line one\nLine two"


# parse_synced_lyrics should turn timestamps into seconds paired with the line text.
def test_parse_synced_lyrics():
    synced = "[00:10.00] Line one\n[01:13.50] Line two"
    result = parse_synced_lyrics(synced)

    assert result == [
        {"time": 10.0, "text": "Line one"},
        {"time": 73.5, "text": "Line two"},
    ]


# parse_synced_lyrics should skip lines without a timestamp and handle empty input.
def test_parse_synced_lyrics_skips_untimed_and_empty():
    assert parse_synced_lyrics("") == []
    assert parse_synced_lyrics(None) == []

    result = parse_synced_lyrics("Lyrics by Someone\n[00:05.00] Real line")
    assert result == [{"time": 5.0, "text": "Real line"}]