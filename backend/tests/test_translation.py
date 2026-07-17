import requests

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


# Stub DeepL translation API response.
class MockDeepLResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return {"translations": [{"text": "你好", "detected_source_language": "ES"}]}


# Without a DeepL key, translate_text should use MyMemory and return its string.
def test_translate_text_uses_mymemory_without_key(monkeypatch):
    monkeypatch.delenv("DEEPL_API_KEY", raising=False)

    def mock_get(*args, **kwargs):
        return MockResponse()

    monkeypatch.setattr("services.translation_service.requests.get", mock_get)

    result = translate_text("Hola", source_lang="es", target_lang="en")

    assert result == "Hello"


# With a DeepL key and a supported language pair, DeepL should be used.
def test_translate_text_uses_deepl_when_available(monkeypatch):
    monkeypatch.setenv("DEEPL_API_KEY", "test-key")

    def mock_post(*args, **kwargs):
        return MockDeepLResponse()

    monkeypatch.setattr("services.translation_service.requests.post", mock_post)

    result = translate_text("Hola", source_lang="es", target_lang="zh")

    assert result == "你好"


# If DeepL errors (e.g. quota exhausted), translate_text falls back to MyMemory.
def test_translate_text_falls_back_to_mymemory_on_deepl_error(monkeypatch):
    monkeypatch.setenv("DEEPL_API_KEY", "test-key")

    def mock_post(*args, **kwargs):
        raise requests.RequestException("quota exhausted")

    def mock_get(*args, **kwargs):
        return MockResponse()

    monkeypatch.setattr("services.translation_service.requests.post", mock_post)
    monkeypatch.setattr("services.translation_service.requests.get", mock_get)

    result = translate_text("Hola", source_lang="es", target_lang="en")

    assert result == "Hello"


# DeepL doesn't support every language; unsupported targets route to MyMemory.
def test_translate_text_uses_mymemory_for_unsupported_language(monkeypatch):
    monkeypatch.setenv("DEEPL_API_KEY", "test-key")

    def mock_post(*args, **kwargs):
        raise AssertionError("DeepL should not be called for unsupported languages")

    def mock_get(*args, **kwargs):
        return MockResponse()

    monkeypatch.setattr("services.translation_service.requests.post", mock_post)
    monkeypatch.setattr("services.translation_service.requests.get", mock_get)

    # Hindi ("hi") is not in DEEPL_SUPPORTED, so MyMemory must handle it.
    result = translate_text("Hola", source_lang="es", target_lang="hi")

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