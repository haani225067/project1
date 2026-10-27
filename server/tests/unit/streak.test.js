const { calculateStreaks } = require('../../src/utils/streak');

describe('Streak Engine (streak.js)', () => {
  const TODAY = '2026-03-30';

  test('handles empty completions list gracefully', () => {
    const stats = calculateStreaks([], TODAY);
    expect(stats).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRateLast30Days: 0,
    });

    const nullStats = calculateStreaks(null, TODAY);
    expect(nullStats.currentStreak).toBe(0);
    expect(nullStats.longestStreak).toBe(0);
  });

  test('handles single day completion: done today', () => {
    const stats = calculateStreaks(['2026-03-30'], TODAY);
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(1);
    expect(stats.totalCompletions).toBe(1);
  });

  test('handles single day completion: done yesterday (today not done yet)', () => {
    // Today is 2026-03-30; completed yesterday 2026-03-29
    const stats = calculateStreaks(['2026-03-29'], TODAY);
    expect(stats.currentStreak).toBe(1); // Streak active because today is still underway
    expect(stats.longestStreak).toBe(1);
  });

  test('resets current streak to 0 if both today and yesterday were missed', () => {
    // Last completed 2026-03-28 (2 days ago)
    const stats = calculateStreaks(['2026-03-28'], TODAY);
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(1);
    expect(stats.totalCompletions).toBe(1);
  });

  test('calculates multi-day consecutive streak ending today', () => {
    const dates = ['2026-03-28', '2026-03-29', '2026-03-30'];
    const stats = calculateStreaks(dates, TODAY);
    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
    expect(stats.totalCompletions).toBe(3);
  });

  test('calculates multi-day consecutive streak when today is NOT done yet', () => {
    // 4-day streak ending yesterday
    const dates = ['2026-03-26', '2026-03-27', '2026-03-28', '2026-03-29'];
    const stats = calculateStreaks(dates, TODAY);
    expect(stats.currentStreak).toBe(4);
    expect(stats.longestStreak).toBe(4);
  });

  test('handles gap correctly: separates current streak from past longest streak', () => {
    // Past 5-day streak, then 2-day gap, then 2-day current streak ending today
    const dates = [
      '2026-03-20',
      '2026-03-21',
      '2026-03-22',
      '2026-03-23',
      '2026-03-24', // 5-day streak
      // Gap: 25, 26, 27 missed
      '2026-03-28', // Single day
      // Gap: 29 missed
      '2026-03-30', // Done today
    ];
    const stats = calculateStreaks(dates, TODAY);
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(5);
    expect(stats.totalCompletions).toBe(7);
  });

  test('handles month boundaries seamlessly', () => {
    // March 30, March 31, April 1, April 2
    const dates = ['2026-03-30', '2026-03-31', '2026-04-01', '2026-04-02'];
    const stats = calculateStreaks(dates, '2026-04-02');
    expect(stats.currentStreak).toBe(4);
    expect(stats.longestStreak).toBe(4);
  });

  test('handles year boundaries seamlessly', () => {
    // Dec 30, Dec 31, Jan 01, Jan 02
    const dates = ['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02'];
    const stats = calculateStreaks(dates, '2026-01-02');
    expect(stats.currentStreak).toBe(4);
    expect(stats.longestStreak).toBe(4);
  });

  test('handles leap day boundary (Feb 28, Feb 29, Mar 01 in leap year 2024)', () => {
    const dates = ['2024-02-28', '2024-02-29', '2024-03-01'];
    const stats = calculateStreaks(dates, '2024-03-01');
    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
  });

  test('calculates 30-day completion rate correctly', () => {
    // 15 days out of last 30 = 50%
    const dates = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date(Date.UTC(2026, 2, 30 - i));
      dates.push(d.toISOString().slice(0, 10));
    }
    const stats = calculateStreaks(dates, TODAY);
    expect(stats.completionRateLast30Days).toBe(50);
  });

  test('handles unordered and duplicate dates', () => {
    const dates = [
      '2026-03-30',
      '2026-03-29',
      '2026-03-30', // duplicate
      '2026-03-28',
    ];
    const stats = calculateStreaks(dates, TODAY);
    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
    expect(stats.totalCompletions).toBe(3);
  });
});
