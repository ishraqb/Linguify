from datetime import date, timedelta

from models import User, Vocabulary
from extensions import db
from services.review_service import INTERVALS, review_word


def _user_and_word():
  user = User(spotify_id="test-user", display_name="Tester")
  db.session.add(user)
  db.session.commit()
  word = Vocabulary(
    user_id=user.id,
    word="hola",
    translation="hello",
    target_language="en",
    source_language="es",
    review_box=0,
    next_review_at=date(2026, 1, 1),
  )
  db.session.add(word)
  db.session.commit()
  return word


def test_correct_review_advances_box(app_ctx):
  word = _user_and_word()
  review_word(word, True, today=date(2026, 1, 1))
  assert word.review_box == 1
  assert word.next_review_at == date(2026, 1, 1) + timedelta(days=INTERVALS[1])


def test_incorrect_review_resets_box(app_ctx):
  word = _user_and_word()
  review_word(word, True, today=date(2026, 1, 1))
  review_word(word, False, today=date(2026, 1, 4))
  assert word.review_box == 0
  assert word.next_review_at == date(2026, 1, 4) + timedelta(days=INTERVALS[0])
