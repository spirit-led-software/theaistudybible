/**
 * Returns today's date as a string in the format YYYY-MM-DD
 *
 * @returns {string} date string in the format YYYY-MM-DD
 * @example
 * getTodaysDateString(); // "2021-01-01"
 * getTodaysDateString(); // "2021-01-02"
 * getTodaysDateString(); // "2021-01-03"
 */
export function getTodaysDateString() {
  // format date to YYYY-MM-DD
  const date = new Date();
  const year = date.getFullYear();

  const month = date.getMonth() + 1;
  const monthString = month < 10 ? `0${month}` : month;

  const day = date.getDate();
  const dayString = day < 10 ? `0${day}` : day;

  const dateString = `${year}-${monthString}-${dayString}`;

  return dateString;
}

/**
 * Returns the current date in UTC
 *
 * @returns {Date} UTC date
 */
export function getUtcDate() {
  return new Date(new Date().toUTCString());
}
