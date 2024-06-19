import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function gatherElementIdsByVerseId(id: string) {
  const els = document.querySelectorAll(`[data-verse-id="${id}"][data-type="text"]`);
  return Array.from(new Set(Array.from(els).map((el) => el.id)));
}

export function gatherElementIdsAndVerseNumberByVerseId(id: string) {
  const els = document.querySelectorAll(`[data-verse-id="${id}"][data-type="text"]`);
  return {
    ids: Array.from(new Set(Array.from(els).map((el) => el.id))),
    verseNumber: els[0].getAttribute('data-verse-number')
  };
}

export function hexToRgb(hex: string) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

export const formVerseString = (verseNumbers: number[]) => {
  if (verseNumbers.length === 0) {
    return '';
  }

  let verseString = '';
  let start = verseNumbers[0];
  let end = verseNumbers[0];
  for (let i = 1; i < verseNumbers.length; i++) {
    if (verseNumbers[i] === end + 1) {
      end = verseNumbers[i];
    } else {
      if (start === end) {
        verseString += `${start}, `;
      } else {
        verseString += `${start}-${end}, `;
      }
      start = end = verseNumbers[i];
    }
  }
  if (start === end) {
    verseString += `${start}`;
  } else {
    verseString += `${start}-${end}`;
  }
  return verseString;
};