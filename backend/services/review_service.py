"""Leitner-style spaced repetition for saved vocabulary."""

from datetime import date, timedelta

from extensions import db
from models import Vocabulary

# Days until the next review at each box (0 = new / missed).
INTERVALS = (1, 3, 7, 14, 30)


def due_filter(query, today=None):
    today = today or date.today()
    return query.filter(
        db.or_(Vocabulary.next_review_at.is_(None), Vocabulary.next_review_at <= today)
    )


def review_word(item, correct, today=None):
    today = today or date.today()
    box = item.review_box or 0
    if correct:
        box = min(box + 1, len(INTERVALS) - 1)
    else:
        box = 0
    item.review_box = box
    item.last_reviewed_at = today
    item.next_review_at = today + timedelta(days=INTERVALS[box])
    db.session.commit()
    return item
