const { addDays, diffInDays, isValidDateString, getUtcTodayString } = require('./dates');

/**
 * Calculates streaks and metrics for a list of completed date strings (YYYY-MM-DD).
 * 
 * Rules:
 * - Current streak: Number of consecutive days ending TODAY, or ending YESTERDAY
 *   if today is not yet completed (forgiving mode until the day is missed).
 * - Longest streak: Maximum consecutive days across all recorded history.
 * 
 * @param {string[]} dates - Array of date strings formatted as YYYY-MM-DD
 * @param {string} [todayDateStr] - Reference date for today (defaults to UTC today)
 * @returns {{ currentStreak: number, longestStreak: number, totalCompletions: number, completionRateLast30Days: number }}
 */
const calculateStreaks = (dates = [], todayDateStr = null) => {
  const today = todayDateStr || getUtcTodayString();

  if (!dates || !Array.isArray(dates) || dates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRateLast30Days: 0,
    };
  }

  // Filter valid dates, deduplicate, and sort ascending
  const uniqueDates = Array.from(
    new Set(dates.filter((d) => typeof d === 'string' && isValidDateString(d)))
  ).sort();

  if (uniqueDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRateLast30Days: 0,
    };
  }

  const completedSet = new Set(uniqueDates);

  // 1. Calculate Longest Streak
  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = diffInDays(uniqueDates[i], uniqueDates[i - 1]);
    if (diff === 1) {
      currentRun += 1;
    } else if (diff > 1) {
      currentRun = 1;
    }
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
  }

  // 2. Calculate Current Streak
  // Check if today is completed, or if tomorrow is completed (due to timezone offset),
  // or fall back to yesterday if today is not completed yet.
  let anchor = null;
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);

  if (completedSet.has(tomorrow) && completedSet.has(today)) {
    anchor = tomorrow;
  } else if (completedSet.has(today)) {
    anchor = today;
  } else if (completedSet.has(yesterday)) {
    anchor = yesterday;
  }

  let currentStreak = 0;
  if (anchor) {
    let checkDate = anchor;
    while (completedSet.has(checkDate)) {
      currentStreak += 1;
      checkDate = addDays(checkDate, -1);
    }
  }

  // 3. Total completions
  const totalCompletions = uniqueDates.length;

  // 4. Completion rate in the last 30 days (today inclusive + previous 29 days)
  let completionsInLast30 = 0;
  for (let i = 0; i < 30; i++) {
    const pastDay = addDays(today, -i);
    if (completedSet.has(pastDay)) {
      completionsInLast30 += 1;
    }
  }
  const completionRateLast30Days = Math.round((completionsInLast30 / 30) * 100);

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRateLast30Days,
  };
};

module.exports = {
  calculateStreaks,
};
