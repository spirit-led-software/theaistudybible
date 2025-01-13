export const formNumberSequenceString = (numbers?: number[]) => {
  if (!numbers || numbers.length === 0) {
    return '';
  }

  let verseString = '';
  let start = numbers[0];
  let end = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] === end + 1) {
      end = numbers[i];
    } else {
      if (start === end) {
        verseString += `${start}, `;
      } else {
        verseString += `${start}-${end}, `;
      }
      start = end = numbers[i];
    }
  }
  if (start === end) {
    verseString += `${start}`;
  } else {
    verseString += `${start}-${end}`;
  }
  return verseString;
};
