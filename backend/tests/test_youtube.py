from services.youtube_service import simplify_video


def test_simplify_video_flattens_fields():
    raw = {
        "id": {"videoId": "abc123"},
        "snippet": {
            "title": "Song One",
            "channelTitle": "Channel A",
            "publishedAt": "2024-01-01T00:00:00Z",
            "thumbnails": {"medium": {"url": "http://img"}},
        },
    }
    result = simplify_video(raw)
    assert result["id"] == "abc123"
    assert result["title"] == "Song One"
    assert result["channelTitle"] == "Channel A"
    assert result["thumbnailUrl"] == "http://img"


def test_simplify_video_falls_back_to_default_thumbnail():
    raw = {
        "id": {"videoId": "xyz789"},
        "snippet": {
            "title": "Song Two",
            "channelTitle": "Channel B",
            "publishedAt": "2024-02-02T00:00:00Z",
            "thumbnails": {"default": {"url": "http://fallback-img"}},
        },
    }
    result = simplify_video(raw)
    assert result["thumbnailUrl"] == "http://fallback-img"


def test_simplify_video_handles_none():
    assert simplify_video(None) is None
