/**
 * Frontend date utilities operating on local calendar time (YYYY-MM-DD)
 * to avoid timezone offset discrepancies between client and server.
 */

/**
 * Returns today's date in local calendar time formatted as YYYY-MM-DD.
 * Note: Never use new Date().toISOString() for local date as it yields UTC!
 */
export const getLocalTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Adds or subtracts days to a YYYY-MM-DD string
 */
export const addDays = (dateStr, daysToAdd) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + daysToAdd);

  const resYear = date.getFullYear();
  const resMonth = String(date.getMonth() + 1).padStart(2, '0');
  const resDay = String(date.getDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
};

/**
 * Difference in days (dateStrA - dateStrB)
 */
export const diffInDays = (dateStrA, dateStrB) => {
  const [yA, mA, dA] = dateStrA.split('-').map(Number);
  const [yB, mB, dB] = dateStrB.split('-').map(Number);
  const a = new Date(yA, mA - 1, dA);
  const b = new Date(yB, mB - 1, dB);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((a - b) / msPerDay);
};

/**
 * Formats YYYY-MM-DD into a human-friendly format
 * e.g., "Monday, Oct 27, 2026"
 */
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Formats short date e.g. "Oct 27"
 */
export const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};
