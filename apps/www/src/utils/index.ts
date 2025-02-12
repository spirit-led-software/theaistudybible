export function gatherElementIdsByVerseNumber(verseNumber: number) {
  const els = document.querySelectorAll(`[data-verse-number="${verseNumber}"]`);
  return Array.from(new Set(Array.from(els).map((el) => el.id)));
}

export { hexToRgb } from './hex-to-rgb';
