from services.difficulty_service import compute_difficulty


# Common English words should rate as an easier (mostly common-word) song.
def test_compute_difficulty_common_words():
    result = compute_difficulty("I love you and you love me", "en")
    assert result is not None
    assert result["level"] == "Beginner"
    assert 0 <= result["score"] <= 100
    assert result["rare_word_ratio"] == 0.0


# Rare vocabulary should score harder than everyday words.
def test_compute_difficulty_rare_harder_than_common():
    common = compute_difficulty("the and you are it", "en")
    rare = compute_difficulty("perspicacious sesquipedalian antediluvian", "en")
    assert rare["score"] > common["score"]
    assert rare["level"] == "Advanced"


# Empty lyrics have nothing to score.
def test_compute_difficulty_empty():
    assert compute_difficulty("", "en") is None


# Unsupported languages are skipped rather than mis-scored.
def test_compute_difficulty_unsupported_language():
    assert compute_difficulty("hello world", "xx") is None
