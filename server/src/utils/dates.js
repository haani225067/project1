/**
 * Date utility functions designed to operate purely on calendar dates (YYYY-MM-DD)
 * to avoid UTC / local timezone offset bugs.
 */

// Regular expression to match YYYY-MM-DD
const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Validates format and calendar existence (e.g. rejects 2026-02-30 or non-leap Feb 29)
 * @param {string} dateStr 
 * @returns {boolean}
 */
const isValidDateString = (dateStr) => {
  if (typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  // Month is 0-indexed in JS Date
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

/**
 * Returns the current date in UTC as YYYY-MM-DD
 * @returns {string}
 */
const getUtcTodayString = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Adds or subtracts days to a YYYY-MM-DD date string using pure UTC calendar math
 * @param {string} dateStr 
 * @param {number} daysToAdd 
 * @returns {string}
 */
const addDays = (dateStr, daysToAdd) => {
  if (!isValidDateString(dateStr)) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + daysToAdd);

  const resYear = date.getUTCFullYear();
  const resMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const resDay = String(date.getUTCDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
};

/**
 * Returns difference in days: (dateStrA - dateStrB)
 * @param {string} dateStrA 
 * @param {string} dateStrB 
 * @returns {number}
 */
const diffInDays = (dateStrA, dateStrB) => {
  if (!isValidDateString(dateStrA) || !isValidDateString(dateStrB)) {
    throw new Error('Both arguments must be valid YYYY-MM-DD date strings');
  }
  const [yA, mA, dA] = dateStrA.split('-').map(Number);
  const [yB, mB, dB] = dateStrB.split('-').map(Number);

  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utcA - utcB) / msPerDay);
};

/**
 * Validates that a date is allowed for habit completion:
 * - Not more than 1 day ahead of server's current UTC date
 * - Not more than 30 days in the past (back-filling up to 30 days)
 * @param {string} dateStr 
 * @param {string} [serverUtcToday] 
 * @returns {{ valid: boolean, reason?: string }}
 */
const isDateWithinAllowedRange = (dateStr, serverUtcToday = null) => {
  if (!isValidDateString(dateStr)) {
    return { valid: false, reason: 'Date format must be a valid YYYY-MM-DD date' };
  }

  const today = serverUtcToday || getUtcTodayString();
  const diffFromToday = diffInDays(dateStr, today);

  if (diffFromToday > 1) {
    return { valid: false, reason: 'Date cannot be more than 1 day ahead of today' };
  }

  if (diffInDays(today, dateStr) > 30) {
    return { valid: false, reason: 'Back-filling is limited to the past 30 days' };
  }

  return { valid: true };
};

/**
 * Returns an array of consecutive date strings between start and end (inclusive)
 * @param {string} startDateStr 
 * @param {string} endDateStr 
 * @returns {string[]}
 */
const getDaysList = (startDateStr, endDateStr) => {
  const diff = diffInDays(endDateStr, startDateStr);
  if (diff < 0) return [];
  const list = [];
  for (let i = 0; i <= diff; i++) {
    list.push(addDays(startDateStr, i));
  }
  return list;
};

/**
 * Returns Monday to Sunday dates for the week containing anchorDateStr
 * @param {string} anchorDateStr 
 * @returns {{ weekStart: string, weekEnd: string, days: string[] }}
 */
const getWeekRange = (anchorDateStr) => {
  if (!isValidDateString(anchorDateStr)) {
    throw new Error(`Invalid anchor date string: ${anchorDateStr}`);
  }
  const [year, month, day] = anchorDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  
  // getUTCDay: 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const dayOfWeek = date.getUTCDay();
  // Monday offset: if Sunday (0), Monday was 6 days ago (-6). Otherwise, -(dayOfWeek - 1).
  const distanceToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);

  const weekStart = addDays(anchorDateStr, distanceToMonday);
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }
  const weekEnd = days[6];

  return { weekStart, weekEnd, days };
};

module.exports = {
  isValidDateString,
  getUtcTodayString,
  addDays,
  diffInDays,
  isDateWithinAllowedRange,
  getDaysList,
  getWeekRange,
};
