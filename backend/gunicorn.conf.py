# Gunicorn settings, auto-loaded when running `gunicorn app:app` from backend/.
# The first (uncached) full-song translation can take longer than gunicorn's
# default 30s, so allow more time before a worker is killed. Later loads are
# instant because translations are cached in the database.
timeout = 120
graceful_timeout = 120
