from datetime import datetime, timezone
from extensions import db

def utc_now():
  return datetime.now(timezone.utc)
class User(db.Model):
  __tablename__ = "users"

  id = db.Column(db.Integer, primary_key=True)
  spotify_id = db.Column(db.String(120), unique=True, nullable=False)
  display_name = db.Column(db.String(120))
  created_at = db.Column(db.DateTime, default=utc_now)

  vocab_words = db.relationship("Vocabulary", back_populates="user", cascade="all, delete-orphan")

class Song(db.Model):
  __tablename__ = "songs"
  id = db.Column(db.Integer, primary_key=True)
  spotify_track_id = db.Column(db.String(120), unique=True, nullable=True)
  genius_id = db.Column(db.String(120), nullable=True)
  title = db.Column(db.String(255), nullable=False)
  artist = db.Column(db.String(255), nullable=True)
  lyrics = db.Column(db.Text, nullable=True)
  created_at = db.Column(db.DateTime, default=utc_now)
  updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now)
  album = db.Column(db.String(255), nullable=True)

  translations = db.relationship("Translation", back_populates="song", cascade="all, delete-orphan")
  vocab_words = db.relationship("Vocabulary", back_populates="song")

class Translation(db.Model):
  __tablename__ = "translations"
  id = db.Column(db.Integer, primary_key=True)
  song_id = db.Column(db.Integer, db.ForeignKey("songs.id"), nullable=False)
  target_language = db.Column(db.String(20), nullable=False)
  translated_lyrics = db.Column(db.Text, nullable=False)
  created_at = db.Column(db.DateTime, default=utc_now)
  updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now)

  song = db.relationship("Song", back_populates="translations")
  __table_args__=(
    db.UniqueConstraint("song_id", "target_language", name="unique_song_language_translation"),
  )
class Vocabulary(db.Model):
    __tablename__ = "vocab"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    song_id = db.Column(db.Integer, db.ForeignKey("songs.id"), nullable=True)
    word = db.Column(db.String(120), nullable=False)
    translation = db.Column(db.String(255), nullable=False)
    target_language = db.Column(db.String(20), nullable=False)
    example_sentence = db.Column(db.Text, nullable=True)
    pronunciation = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now)

    user = db.relationship("User", back_populates="vocab_words")
    song = db.relationship("Song", back_populates="vocab_words")