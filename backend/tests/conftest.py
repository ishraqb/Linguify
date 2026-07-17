import os
import tempfile

import pytest

# Point the app at a throwaway SQLite file before importing it, so tests never
# touch the real dev database.
_fd, _DB_PATH = tempfile.mkstemp(suffix=".db")
os.close(_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{_DB_PATH}"

from app import create_app
from extensions import db


# App with a fresh, empty database for each test that needs the DB.
@pytest.fixture
def app_ctx():
  app = create_app()
  with app.app_context():
    db.drop_all()
    db.create_all()
    yield app
    db.session.remove()
