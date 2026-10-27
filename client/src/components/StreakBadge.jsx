import React from 'react';

const StreakBadge = ({ streak = 0, longestStreak = null, showLabel = true }) => {
  const isMilestone = streak === 7 || streak === 30 || streak === 100 || (streak > 0 && streak % 50 === 0);
  const isActive = streak > 0;

  let title = `${streak} day streak`;
  if (longestStreak !== null) {
    title += ` (Best: ${longestStreak} days)`;
  }
  if (isMilestone) {
    title += ` 🏆 Milestone reached!`;
  }

  return (
    <span
      className={`streak-badge ${isActive ? 'streak-active' : ''} ${isMilestone ? 'streak-milestone' : ''}`}
      title={title}
      aria-label={title}
    >
      <span aria-hidden="true">{isMilestone ? '🌟' : '🔥'}</span>
      <span>{streak}</span>
      {showLabel && <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{streak === 1 ? 'day' : 'days'}</span>}
    </span>
  );
};

export default StreakBadge;
