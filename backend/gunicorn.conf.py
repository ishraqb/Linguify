# Gunicorn settings, auto-loaded when running `gunicorn app:app` from backend/.

# Memory: the NLP libs are heavy (wordfreq ~60MB, and simplemma loads ~100MB+
# per language on demand), so a single process on the Spanish->English path sits
# around ~250MB. Render's free tier is 512MB, so we must NOT run multiple
# workers (each would load its own copy and blow the limit). Use one process
# with a few threads instead: threads share the loaded lib data, but still let
# health checks and user requests run concurrently.
workers = 1
threads = 4
worker_class = "gthread"

# The worker slowly accumulates memory as it touches more languages (each
# simplemma/wordfreq language loads and is never freed). Recycle the worker
# after a batch of requests so that memory is reclaimed before it hits the
# 512MB cap and Render OOM-restarts us mid-request.
max_requests = 400
max_requests_jitter = 50

# The first (uncached) full-song translation can take longer than gunicorn's
# default 30s, so allow more time before a worker is killed. Later loads are
# instant because translations are cached in the database.
timeout = 120
graceful_timeout = 120


# After a worker forks, drop any DB connections inherited from the parent
# process. Reusing a parent's SSL socket in a child corrupts it (Postgres
# "SSL error: decryption failed or bad record mac" / "SSL SYSCALL error: EOF"),
# so each worker must open its own fresh connections.
def post_fork(server, worker):
    try:
        from app import app
        from extensions import db
        with app.app_context():
            db.engine.dispose()
    except Exception:
        pass
