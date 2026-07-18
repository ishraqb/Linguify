/**
 * Gamified stats card for the dashboard.
 * Shows the day streak, level + XP bar, words learned, and daily goal progress.
 */
function ProgressCard({ progress }) {
  if (!progress) {
    return null
  }

  const xpPercent = Math.min(100, Math.round((progress.xpIntoLevel / progress.xpPerLevel) * 100))
  const goalPercent = progress.dailyGoal
    ? Math.min(100, Math.round((progress.wordsToday / progress.dailyGoal) * 100))
    : 0

  return (
    <div className="progress-card">
      <div className="progress-stats">
        <div className="progress-stat">
          <span className="progress-stat-value">🔥 {progress.streak}</span>
          <span className="progress-stat-label">Day streak</span>
        </div>
        <div className="progress-stat">
          <span className="progress-stat-value">Lvl {progress.level}</span>
          <span className="progress-stat-label">{progress.masteryLabel}</span>
        </div>
        <div className="progress-stat">
          <span className="progress-stat-value">{progress.wordsLearned}</span>
          <span className="progress-stat-label">Words learned</span>
        </div>
      </div>

      <div className="progress-bar-section">
        <div className="progress-bar-label">
          <span>Level {progress.level}</span>
          <span>{progress.xpIntoLevel}/{progress.xpPerLevel} XP</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${xpPercent}%` }} />
        </div>
      </div>

      <div className="progress-bar-section">
        <div className="progress-bar-label">
          <span>Daily goal {progress.dailyGoalMet ? '✅' : ''}</span>
          <span>{progress.wordsToday}/{progress.dailyGoal} words</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill goal" style={{ width: `${goalPercent}%` }} />
        </div>
      </div>
    </div>
  )
}

export default ProgressCard
