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

  return `${year}-${monthString}-${dayString}`;
}

/**
 * Returns the current date in UTC
 *
 * @returns {Date} UTC date
 */
export function getUtcDate() {
  return new Date(new Date().toUTCString());
}

export function getTimeStringFromSeconds(secondsProp: number): string {
  const hours = Math.floor(secondsProp / 3600);
  const minutes = Math.floor((secondsProp - hours * 3600) / 60);
  const seconds = secondsProp - hours * 3600 - minutes * 60;

  if (hours) {
    if (minutes) {
      return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}, & ${seconds} second${seconds > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} & ${seconds} second${seconds > 1 ? 's' : ''}`;
  }
  if (minutes) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} & ${seconds} second${seconds > 1 ? 's' : ''}`;
  }
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
}
