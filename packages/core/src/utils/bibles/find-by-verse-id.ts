import type { Content, TextContent } from '@/schemas/bibles/contents';

export function findTextContentByVerseNumbers(
  contents: Content[],
  verseNumbers: number[],
): TextContent[] {
  const found: TextContent[] = [];
  for (const content of contents) {
    if (
      content.type === 'text' &&
      content.verseNumber &&
      verseNumbers.includes(content.verseNumber)
    ) {
      found.push(content);
    }
    if (content.type === 'para') {
      found.push(...findTextContentByVerseNumbers(content.contents, verseNumbers));
    }
    if (content.type === 'char') {
      found.push(...findTextContentByVerseNumbers(content.contents, verseNumbers));
    }
    if (content.type === 'note') {
      found.push(...findTextContentByVerseNumbers(content.contents, verseNumbers));
    }
  }
  return found;
}
