"""Add columns that create_all() won't apply to an existing production database."""

from sqlalchemy import inspect, text

from extensions import db


# Extra columns introduced after the first deploy. create_all() never ALTERs
# existing tables, so we add anything missing on startup.
_VOCAB_COLUMNS = {
    "source_language": "ALTER TABLE vocab ADD COLUMN source_language VARCHAR(20)",
    "review_box": "ALTER TABLE vocab ADD COLUMN review_box INTEGER DEFAULT 0",
    "next_review_at": "ALTER TABLE vocab ADD COLUMN next_review_at DATE",
    "last_reviewed_at": "ALTER TABLE vocab ADD COLUMN last_reviewed_at DATE",
}

_PROGRESS_COLUMNS = {
    "last_song_date": "ALTER TABLE user_progress ADD COLUMN last_song_date DATE",
    "last_quiz_date": "ALTER TABLE user_progress ADD COLUMN last_quiz_date DATE",
}


def _add_missing(table, statements):
    inspector = inspect(db.engine)
    if table not in inspector.get_table_names():
        return
    existing = {column["name"] for column in inspector.get_columns(table)}
    added = False
    for name, sql in statements.items():
        if name not in existing:
            db.session.execute(text(sql))
            added = True
    if added:
        db.session.commit()


def ensure_schema():
    _add_missing("vocab", _VOCAB_COLUMNS)
    _add_missing("user_progress", _PROGRESS_COLUMNS)
