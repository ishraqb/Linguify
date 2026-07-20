from datetime import date

from services.progress_service import record_activity, serialize_progress, set_daily_goal


# A first activity starts a 1-day streak and awards XP.
def test_first_activity_starts_streak(app_ctx):
  day = date(2026, 1, 1)
  progress = record_activity(1, "word", today=day)

  assert progress.current_streak == 1
  assert progress.total_xp == 10

  data = serialize_progress(progress, 1, today=day)
  assert data["streak"] == 1
  assert data["wordsToday"] == 1
  assert data["level"] == 1


# Activity on consecutive days extends the streak and resets the daily count.
def test_consecutive_days_extend_streak(app_ctx):
  record_activity(1, "word", today=date(2026, 1, 1))
  progress = record_activity(1, "word", today=date(2026, 1, 2))

  assert progress.current_streak == 2
  assert serialize_progress(progress, 1, today=date(2026, 1, 2))["wordsToday"] == 1


# Missing a day resets the streak back to 1.
def test_gap_breaks_streak(app_ctx):
  record_activity(1, "word", today=date(2026, 1, 1))
  progress = record_activity(1, "word", today=date(2026, 1, 3))

  assert progress.current_streak == 1
  assert progress.longest_streak == 1


# The daily goal is met once enough words are saved that day; XP accumulates.
def test_daily_goal_met_and_xp(app_ctx):
  day = date(2026, 1, 1)
  set_daily_goal(1, 2)
  record_activity(1, "word", today=day)
  progress = record_activity(1, "word", today=day)

  data = serialize_progress(progress, 1, today=day)
  assert data["wordsToday"] == 2
  assert data["dailyGoalMet"] is True

  progress = record_activity(1, "quiz", today=day)
  assert serialize_progress(progress, 1, today=day)["xp"] == 40
