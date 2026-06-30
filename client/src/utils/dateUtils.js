/**
 * Converts a JavaScript Date object into a YYYY-MM-DD string
 * using the local timezone, avoiding UTC shift bugs.
 */
export const getLocalISODate = (date = new Date()) => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offset);
  return local.toISOString().split('T')[0];
};

/**
 * Adds days to a date string (YYYY-MM-DD) and returns
 * the new date as a YYYY-MM-DD string safely.
 */
export const addDaysToLocal = (dateStr, days) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return getLocalISODate(d);
};
