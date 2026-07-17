"""Track learning progress and gamification: XP, level, streaks, and a daily goal."""

from datetime import date, timedelta
from extensions import db
from models import UserProgress, Vocabulary

# XP awarded per activity type.
XP_PER_ACTIVITY = {"word": 10, "song": 15, "quiz": 20}
XP_PER_LEVEL = 100
ALLOWED_ACTIVITIES = set(XP_PER_ACTIVITY)


# Fetch the user's progress row, creating an empty one on first use.
def get_or_create_progress(user_id):
  progress = UserProgress.query.filter_by(user_id=user_id).first()
  if not progress:
    progress = UserProgress(user_id=user_id)
    db.session.add(progress)
    db.session.commit()
  return progress


# Record one activity: award XP and update the streak and daily word count.
def record_activity(user_id, activity_type="word", today=None):
  progress = get_or_create_progress(user_id)
  today = today or date.today()
  yesterday = today - timedelta(days=1)

  if progress.last_activity_date == today:
    pass  # already active today; streak and day count carry over
  elif progress.last_activity_date == yesterday:
    progress.current_streak += 1  # consecutive day extends the streak
    progress.daily_count = 0
  else:
    progress.current_streak = 1  # first activity or streak was broken
    progress.daily_count = 0

  progress.last_activity_date = today
  progress.longest_streak = max(progress.longest_streak, progress.current_streak)
  progress.total_xp += XP_PER_ACTIVITY.get(activity_type, 5)
  if activity_type == "word":
    progress.daily_count += 1

  db.session.commit()
  return progress


# Update the user's daily words goal (kept within a sane range).
def set_daily_goal(user_id, goal):
  progress = get_or_create_progress(user_id)
  progress.daily_goal = max(1, min(int(goal), 100))
  db.session.commit()
  return progress


# Map a level number onto a friendly mastery label.
def _mastery_label(level):
  if level >= 10:
    return "Fluent"
  if level >= 6:
    return "Skilled"
  if level >= 3:
    return "Apprentice"
  return "Novice"


# Shape progress into the stats the dashboard shows (with derived level/streak).
def serialize_progress(progress, user_id, today=None):
  today = today or date.today()
  yesterday = today - timedelta(days=1)

  # A streak only counts if there was activity today or yesterday.
  alive = progress.last_activity_date in (today, yesterday)
  streak = progress.current_streak if alive else 0
  words_today = progress.daily_count if progress.last_activity_date == today else 0

  level = progress.total_xp // XP_PER_LEVEL + 1
  words_learned = Vocabulary.query.filter_by(user_id=user_id).count()

  return {
    "xp": progress.total_xp,
    "level": level,
    "masteryLabel": _mastery_label(level),
    "xpIntoLevel": progress.total_xp % XP_PER_LEVEL,
    "xpPerLevel": XP_PER_LEVEL,
    "streak": streak,
    "longestStreak": progress.longest_streak,
    "dailyGoal": progress.daily_goal,
    "wordsToday": words_today,
    "dailyGoalMet": words_today >= progress.daily_goal,
    "wordsLearned": words_learned,
  }
