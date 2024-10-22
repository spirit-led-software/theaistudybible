import type { Content, TextContent } from '@/schemas/bibles/contents';

export function findTextContentByVerseIds(contents: Content[], verseIds: string[]): TextContent[] {
  const found: TextContent[] = [];
  for (const content of contents) {
    if (content.type === 'text' && verseIds.includes(content.verseId)) {
      found.push(content);
    }
    if (content.type === 'para') {
      found.push(...findTextContentByVerseIds(content.contents, verseIds));
    }
    if (content.type === 'char') {
      found.push(...findTextContentByVerseIds(content.contents, verseIds));
    }
    if (content.type === 'note') {
      found.push(...findTextContentByVerseIds(content.contents, verseIds));
    }
  }
  return found;
}
