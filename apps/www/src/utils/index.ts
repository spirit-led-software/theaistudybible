export function gatherElementIdsByVerseCode(code: string) {
  const els = document.querySelectorAll(`[data-verse-code="${code}"][data-type="text"]`);
  return Array.from(new Set(Array.from(els).map((el) => el.id)));
}

export function gatherElementIdsByVerseNumber(verseNumber: number) {
  const els = document.querySelectorAll(`[data-verse-number="${verseNumber}"][data-type="text"]`);
  return Array.from(new Set(Array.from(els).map((el) => el.id)));
}

export function gatherElementIdsAndVerseNumberByVerseCode(code: string) {
  const els = document.querySelectorAll(`[data-verse-code="${code}"][data-type="text"]`);
  return {
    ids: Array.from(new Set(Array.from(els).map((el) => el.id))),
    verseNumber: els[0]?.getAttribute('data-verse-number'),
  };
}

export { hexToRgb } from './hex-to-rgb';
