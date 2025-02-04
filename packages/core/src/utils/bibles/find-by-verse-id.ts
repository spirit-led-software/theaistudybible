import type { Content, TextContent } from '@/schemas/bibles/contents';

export function findTextContentByVerseCodes(
  contents: Content[],
  verseCodes: string[],
): TextContent[] {
  const found: TextContent[] = [];
  for (const content of contents) {
    if (content.type === 'text' && verseCodes.includes(content.verseCode)) {
      found.push(content);
    }
    if (content.type === 'para') {
      found.push(...findTextContentByVerseCodes(content.contents, verseCodes));
    }
    if (content.type === 'char') {
      found.push(...findTextContentByVerseCodes(content.contents, verseCodes));
    }
    if (content.type === 'note') {
      found.push(...findTextContentByVerseCodes(content.contents, verseCodes));
    }
  }
  return found;
}

export function findTextContentByVerseNumbers(
  contents: Content[],
  verseNumbers: number[],
): TextContent[] {
  const found: TextContent[] = [];
  for (const content of contents) {
    if (content.type === 'text' && verseNumbers.includes(content.verseNumber)) {
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
