import spotify_client as sp


# Token counts as expired within a 60s safety buffer.
def test_is_token_expired_respects_60s_buffer():
    assert sp.is_token_expired(1000, now=950) is True   # within the buffer
    assert sp.is_token_expired(1000, now=900) is False  # still safely valid
