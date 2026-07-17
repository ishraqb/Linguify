from services.language_service import detect_language


# detect_language should identify Spanish lyrics.
def test_detect_language_spanish():
    assert detect_language("Hola, esta es una oracion en espanol para detectar") == "es"


# detect_language should ignore LRCLIB timestamps and still detect the text language.
def test_detect_language_ignores_timestamps():
    synced = "[00:10.00] Hello there my friend\n[00:13.50] How are you doing today"
    assert detect_language(synced) == "en"
