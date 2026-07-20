import time

import requests

# Apple Music RSS charts are public, keyless, and include cover artwork.
# The host and paths below are fixed, trusted constants built only from our own
# storefront/limit values (never user input), so this is not an SSRF risk.
_RSS_URL = "https://rss.marketingtools.apple.com/api/v2/{country}/music/most-played/{limit}/songs.json"

# Storefronts chosen to surface international, multilingual hits for the shelf.
_COUNTRIES = [
    ("us", 4),  # English
    ("es", 3),  # Spanish
    ("fr", 3),  # French
    ("br", 3),  # Portuguese
    ("jp", 3),  # Japanese
    ("kr", 3),  # Korean
    ("de", 2),  # German
    ("it", 2),  # Italian
    ("in", 2),  # Hindi / Indian
]

# Cache the mixed chart in-memory so the public landing page stays fast.
_CACHE = {"songs": [], "ts": 0.0}
_TTL_SECONDS = 60 * 60 * 24  # refresh at most once a day


# Apple returns 100x100 thumbnails; ask for a larger crop for crisp covers.
def _upscale(art_url):
    return art_url.replace("100x100bb", "300x300bb") if art_url else art_url


# Fetch the top songs for a single storefront and flatten to our shelf shape.
def _fetch_country(country, count):
    url = _RSS_URL.format(country=country, limit=count)
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    results = response.json().get("feed", {}).get("results", [])

    songs = []
    for item in results:
        title = item.get("name")
        artist = item.get("artistName")
        if not title or not artist:
            continue
        songs.append({
            "id": f"apple-{item.get('id')}",
            "title": title,
            "artist": artist,
            "coverUrl": _upscale(item.get("artworkUrl100")),
        })
    return songs


# A mixed, deduped list of current international top songs for the landing shelf.
def international_top(limit=12):
    now = time.time()
    if _CACHE["songs"] and now - _CACHE["ts"] < _TTL_SECONDS:
        return _CACHE["songs"][:limit]

    per_country = []
    for country, count in _COUNTRIES:
        try:
            per_country.append(_fetch_country(country, count))
        except requests.RequestException:
            per_country.append([])

    # Round-robin across storefronts so the shelf feels global, not US-heavy.
    mixed = []
    seen = set()
    position = 0
    while any(position < len(chart) for chart in per_country):
        for chart in per_country:
            if position < len(chart):
                song = chart[position]
                key = (song["title"].lower(), song["artist"].lower())
                if key not in seen:
                    seen.add(key)
                    mixed.append(song)
        position += 1

    if mixed:
        _CACHE["songs"] = mixed
        _CACHE["ts"] = now
    return mixed[:limit]
