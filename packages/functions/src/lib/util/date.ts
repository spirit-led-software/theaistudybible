export function getTodaysDateString() {
  // format date to YYYY-MM-DD
  const date = new Date();
  const year = date.getFullYear();

  const month = date.getMonth() + 1;
  const monthString = month < 10 ? `0${month}` : month;

  const day = date.getDate();
  const dayString = day < 10 ? `0${day}` : day;

  const dateString = `${year}-${monthString}-${dayString}`;

  return dateString as `${number}-${number}-${number}`;
}
