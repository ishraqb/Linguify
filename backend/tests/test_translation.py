from services.translation_service import translate_text, translate_lines


class MockResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return {
            "responseData": {
                "translatedText": "Hello"
            }
        }


def test_translate_text_mocked(monkeypatch):
    def mock_get(*args, **kwargs):
        return MockResponse()

    monkeypatch.setattr("services.translation_service.requests.get", mock_get)

    result = translate_text("Hola", source_lang="es", target_lang="en")

    assert result == "Hello"


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