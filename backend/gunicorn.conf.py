# Gunicorn settings, auto-loaded when running `gunicorn app:app` from backend/.
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
