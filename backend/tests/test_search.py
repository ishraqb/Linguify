import spotify_client as sp


# simplify_track should flatten artists, album art, and preview URL.
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
