import spotify_client as sp


class FakeResponse:
    status_code = 200

    def raise_for_status(self):
        pass

    def json(self):
        return {
            "tracks": {
                "items": [
                    {
                        "id": "1",
                        "name": "Song One",
                        "artists": [{"name": "Artist A"}],
                        "album": {"name": "Album X", "images": []},
                        "preview_url": None,
                    }
                ]
            }
        }


def test_search_tracks_returns_parsed_json(monkeypatch):
    monkeypatch.setattr(sp.requests, "get", lambda *args, **kwargs: FakeResponse())

    data = sp.search_tracks("fake-token", "hello")
    item = data["tracks"]["items"][0]
    assert item["name"] == "Song One"


def test_simplify_track_flattens_fields():
    raw = {
        "id": "1",
        "name": "Song One",
        "artists": [{"name": "Artist A"}, {"name": "Artist B"}],
        "album": {"name": "Album X", "images": [{"url": "http://img"}]},
        "preview_url": None,
    }
    result = sp.simplify_track(raw)
    assert result["artist"] == "Artist A, Artist B"
    assert result["albumArt"] == "http://img"
    assert result["preview_url"] is None
