from services.translation_service import translate_text, translate_lines


# Stub MyMemory translation API response.
class MockResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return {
            "responseData": {
                "translatedText": "Hello"
            }
        }


# translate_text should return the translated string.
def test_translate_text_mocked(monkeypatch):
    def mock_get(*args, **kwargs):
        return MockResponse()

    monkeypatch.setattr("services.translation_service.requests.get", mock_get)

    result = translate_text("Hola", source_lang="es", target_lang="en")

    assert result == "Hello"


# translate_lines should translate each line into original/translation pairs.
def test_translate_lines_mocked(monkeypatch):
    def mock_translate_text(text, source_lang="auto", target_lang="en"):
        return f"translated-{text}"

    monkeypatch.setattr(
        "services.translation_service.translate_text",
        mock_translate_text,
    )

    result = translate_lines("Hola\nMundo", target_language="en", source_language="es")

    assert result == [
        {"original": "Hola", "translation": "translated-Hola"},
        {"original": "Mundo", "translation": "translated-Mundo"},
    ]


# Repeated lines (e.g. a chorus) should only hit the translation API once.
def test_translate_lines_dedupes_repeats(monkeypatch):
    calls = []

    def mock_translate_text(text, source_lang="auto", target_lang="en"):
        calls.append(text)
        return f"translated-{text}"

    monkeypatch.setattr(
        "services.translation_service.translate_text",
        mock_translate_text,
    )

    result = translate_lines(
        "Chorus\nVerse\nChorus\nChorus",
        target_language="en",
        source_language="es",
    )

    # "Chorus" appears three times but should be translated only once.
    assert calls.count("Chorus") == 1
    assert result[0]["translation"] == "translated-Chorus"
    assert result[2]["translation"] == "translated-Chorus"
    assert result[3]["translation"] == "translated-Chorus"