import spotify_client as sp


def test_token_expiry_timestamp_adds_expires_in():
    assert sp.token_expiry_timestamp(3600, now=1000) == 4600


def test_is_token_expired_respects_60s_buffer():
    assert sp.is_token_expired(1000, now=950) is True   # within the buffer
    assert sp.is_token_expired(1000, now=900) is False  # still safely valid
