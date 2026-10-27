const {
  isValidDateString,
  getUtcTodayString,
  addDays,
  diffInDays,
  isDateWithinAllowedRange,
  getDaysList,
  getWeekRange,
} = require('../../src/utils/dates');

describe('Date Utilities (dates.js)', () => {
  describe('isValidDateString', () => {
    test('accepts valid YYYY-MM-DD dates', () => {
      expect(isValidDateString('2026-03-30')).toBe(true);
      expect(isValidDateString('2024-02-29')).toBe(true); // Leap year 2024
      expect(isValidDateString('2026-12-31')).toBe(true);
    });

    test('rejects non-existent calendar dates', () => {
      expect(isValidDateString('2026-02-29')).toBe(false); // 2026 is not a leap year
      expect(isValidDateString('2026-02-30')).toBe(false);
      expect(isValidDateString('2026-04-31')).toBe(false); // April has 30 days
      expect(isValidDateString('2026-13-01')).toBe(false); // Month 13
    });

    test('rejects malformed date strings', () => {
      expect(isValidDateString('invalid')).toBe(false);
      expect(isValidDateString('2026/03/30')).toBe(false);
      expect(isValidDateString('26-03-2026')).toBe(false);
      expect(isValidDateString(null)).toBe(false);
      expect(isValidDateString(undefined)).toBe(false);
      expect(isValidDateString(12345)).toBe(false);
    });
  });

  describe('addDays', () => {
    test('adds and subtracts days correctly across month boundaries', () => {
      expect(addDays('2026-03-30', 2)).toBe('2026-04-01');
      expect(addDays('2026-04-01', -2)).toBe('2026-03-30');
    });

    test('handles year boundaries correctly', () => {
      expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
      expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    });

    test('handles leap day boundary correctly', () => {
      expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
      expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
      expect(addDays('2026-02-28', 1)).toBe('2026-03-01'); // Non-leap year
    });
  });

  describe('diffInDays', () => {
    test('calculates correct day difference', () => {
      expect(diffInDays('2026-03-30', '2026-03-25')).toBe(5);
      expect(diffInDays('2026-03-25', '2026-03-30')).toBe(-5);
      expect(diffInDays('2026-03-30', '2026-03-30')).toBe(0);
    });
  });

  describe('isDateWithinAllowedRange', () => {
    const mockToday = '2026-03-30';

    test('allows today, yesterday, and up to 1 day ahead (timezone tolerance)', () => {
      expect(isDateWithinAllowedRange('2026-03-30', mockToday).valid).toBe(true);
      expect(isDateWithinAllowedRange('2026-03-29', mockToday).valid).toBe(true);
      expect(isDateWithinAllowedRange('2026-03-31', mockToday).valid).toBe(true);
    });

    test('allows back-filling up to 30 days in the past', () => {
      const past30 = addDays(mockToday, -30);
      expect(isDateWithinAllowedRange(past30, mockToday).valid).toBe(true);
    });

    test('rejects dates older than 30 days', () => {
      const past31 = addDays(mockToday, -31);
      const res = isDateWithinAllowedRange(past31, mockToday);
      expect(res.valid).toBe(false);
      expect(res.reason).toMatch(/limited to the past 30 days/i);
    });

    test('rejects dates more than 1 day in the future', () => {
      const future2 = addDays(mockToday, 2);
      const res = isDateWithinAllowedRange(future2, mockToday);
      expect(res.valid).toBe(false);
      expect(res.reason).toMatch(/more than 1 day ahead/i);
    });
  });

  describe('getWeekRange', () => {
    test('computes Monday-Sunday week for any day of the week', () => {
      // 2026-03-30 is a Monday
      const mondayWeek = getWeekRange('2026-03-30');
      expect(mondayWeek.weekStart).toBe('2026-03-30');
      expect(mondayWeek.weekEnd).toBe('2026-04-05');
      expect(mondayWeek.days.length).toBe(7);

      // 2026-04-01 is a Wednesday of the same week
      const wednesdayWeek = getWeekRange('2026-04-01');
      expect(wednesdayWeek.weekStart).toBe('2026-03-30');
      expect(wednesdayWeek.weekEnd).toBe('2026-04-05');

      // 2026-04-05 is a Sunday of the same week
      const sundayWeek = getWeekRange('2026-04-05');
      expect(sundayWeek.weekStart).toBe('2026-03-30');
      expect(sundayWeek.weekEnd).toBe('2026-04-05');
    });
  });

  describe('getDaysList', () => {
    test('generates inclusive list of dates', () => {
      const list = getDaysList('2026-03-28', '2026-03-31');
      expect(list).toEqual([
        '2026-03-28',
        '2026-03-29',
        '2026-03-30',
        '2026-03-31',
      ]);
    });
  });
});
