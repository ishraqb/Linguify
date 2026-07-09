from services.lyrics_service import fetch_lyrics_from_lrclib


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


def test_fetch_lyrics_from_lrclib(monkeypatch):
    def mock_get(*args, **kwargs):
        return MockResponse()

    monkeypatch.setattr("services.lyrics_service.requests.get", mock_get)

    lyrics = fetch_lyrics_from_lrclib("Test Song", "Test Artist")

    assert lyrics == "Line one\nLine two"