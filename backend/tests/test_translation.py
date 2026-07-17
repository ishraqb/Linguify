import requests

from services.translation_service import translate_text, is_cacheable_translation


# Stub MyMemory translation API response.
class MockResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return {"responseData": {"translatedText": "Hello"}}


# Stub DeepL translation API response.
class MockDeepLResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return {"translations": [{"text": "你好", "detected_source_language": "ES"}]}


# With a DeepL key and a supported language pair, DeepL should be used.
def test_translate_text_uses_deepl_when_available(monkeypatch):
    monkeypatch.setenv("DEEPL_API_KEY", "test-key")

    def mock_post(*args, **kwargs):
        return MockDeepLResponse()

    monkeypatch.setattr("services.translation_service.requests.post", mock_post)

    assert translate_text("Hola", source_lang="es", target_lang="zh") == "你好"


# If DeepL errors (e.g. quota exhausted), translate_text falls back to MyMemory.
def test_translate_text_falls_back_to_mymemory_on_deepl_error(monkeypatch):
    monkeypatch.setenv("DEEPL_API_KEY", "test-key")

    def mock_post(*args, **kwargs):
        raise requests.RequestException("quota exhausted")

    def mock_get(*args, **kwargs):
        return MockResponse()

    monkeypatch.setattr("services.translation_service.requests.post", mock_post)
    monkeypatch.setattr("services.translation_service.requests.get", mock_get)

    assert translate_text("Hola", source_lang="es", target_lang="en") == "Hello"


# A wrong-language result should NOT be cached, so it can be retried later.
def test_is_cacheable_translation_rejects_wrong_language():
    lines = [
        {"original": "你好", "translation": "hello how are you my friend today"},
        {"original": "早上好", "translation": "good morning sir welcome to the show"},
    ]

    assert is_cacheable_translation(lines, "zh") is False
