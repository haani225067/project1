import confetti from 'canvas-confetti';

/**
 * Triggers confetti celebration for streak milestones
 * @param {number} streak 
 */
export const triggerStreakCelebration = (streak) => {
  // Check if milestone (e.g. 7, 30, 100 or every 50 days)
  const isMilestone = streak === 7 || streak === 30 || streak === 100 || (streak > 0 && streak % 50 === 0);

  if (isMilestone) {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#f59e0b', '#10b981', '#ec4899'],
      });
    } catch {
      // Graceful fallback if canvas is not supported
    }
  }
};
