from services.language_service import detect_language


# detect_language should identify English lyrics.
def test_detect_language_english():
    assert detect_language("Hello, this is a simple English sentence to detect") == "en"


# detect_language should identify Spanish lyrics.
def test_detect_language_spanish():
    assert detect_language("Hola, esta es una oracion en espanol para detectar") == "es"


# detect_language should ignore LRCLIB timestamps and still detect the text language.
def test_detect_language_ignores_timestamps():
    synced = "[00:10.00] Hello there my friend\n[00:13.50] How are you doing today"
    assert detect_language(synced) == "en"


# detect_language should return None for empty or whitespace input.
def test_detect_language_empty():
    assert detect_language("") is None
    assert detect_language("   ") is None
