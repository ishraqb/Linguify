from services.difficulty_service import compute_difficulty


# Common English words should rate as an easier (mostly common-word) song.
def test_compute_difficulty_common_words():
    result = compute_difficulty("I love you and you love me", "en")
    assert result is not None
    assert result["level"] == "Beginner"
    assert 0 <= result["score"] <= 100


# Rare vocabulary should score harder than everyday words.
def test_compute_difficulty_rare_harder_than_common():
    common = compute_difficulty("the and you are it", "en")
    rare = compute_difficulty("perspicacious sesquipedalian antediluvian", "en")
    assert rare["score"] > common["score"]
    assert rare["level"] == "Advanced"
