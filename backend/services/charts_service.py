import time
from concurrent.futures import ThreadPoolExecutor

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
_TTL_SECONDS = 60 * 60 * 24  # keep a good result for a day
# If a refresh comes back empty (Apple slow/unreachable), don't retry on every
# request — wait a few minutes so we never hammer it and stall the worker.
_FAIL_TTL_SECONDS = 60 * 5


# Apple returns 100x100 thumbnails; ask for a larger crop for crisp covers.
def _upscale(art_url):
    return art_url.replace("100x100bb", "300x300bb") if art_url else art_url


# Fetch the top songs for a single storefront and flatten to our shelf shape.
# Short timeout so one slow storefront can't stall the whole request/worker.
def _fetch_country(country, count):
    url = _RSS_URL.format(country=country, limit=count)
    response = requests.get(url, timeout=5)
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


# Fetch one storefront, swallowing any error so a single failure returns [].
def _safe_fetch(country_count):
    country, count = country_count
    try:
        return _fetch_country(country, count)
    except requests.RequestException:
        return []


# A mixed, deduped list of current international top songs for the landing shelf.
def international_top(limit=12):
    now = time.time()
    # Serve the cache while fresh. A previously empty result is only considered
    # fresh for a short window so we retry soon without storming Apple.
    ttl = _TTL_SECONDS if _CACHE["songs"] else _FAIL_TTL_SECONDS
    if _CACHE["ts"] and now - _CACHE["ts"] < ttl:
        return _CACHE["songs"][:limit]

    # Fetch all storefronts in parallel so the whole call takes ~one request,
    # not the sum of them (which previously blew past the worker timeout).
    with ThreadPoolExecutor(max_workers=len(_COUNTRIES)) as pool:
        per_country = list(pool.map(_safe_fetch, _COUNTRIES))

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

    # Always record the attempt time so an empty result also gets cached and
    # doesn't retry on every single request (see _FAIL_TTL_SECONDS above).
    _CACHE["songs"] = mixed
    _CACHE["ts"] = now
    return mixed[:limit]
