from services.romanization_service import needs_romanization, romanize_line, romanize_lines


# Non-Latin languages need romanization; Latin-script ones don't.
def test_needs_romanization():
    assert needs_romanization("ru") is True
    assert needs_romanization("ja") is True
    assert needs_romanization("zh-CN") is True
    assert needs_romanization("en") is False
    assert needs_romanization("es") is False


# Cyrillic text is transliterated into Latin script.
def test_romanize_line_cyrillic():
    assert romanize_line("Пачка сигарет", "ru") == "Pachka sigaret"


# Chinese text is transliterated into pinyin.
def test_romanize_line_chinese_pinyin():
    result = romanize_line("月亮", "zh")
    assert "yu" in result.lower()  # 月 -> yuè


# romanize_lines preserves order and length.
def test_romanize_lines_preserves_order():
    result = romanize_lines(["Привет", "мир"], "ru")
    assert result == ["Privet", "mir"]
