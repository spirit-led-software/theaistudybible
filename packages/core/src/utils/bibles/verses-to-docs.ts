import { embeddingModel } from '@/ai/models';
import type { Document } from '@/ai/types/document';
import { numTokensFromString } from '@/ai/utils/num-tokens-from-string';
import { contentsToText } from '@/core/utils/bibles/contents-to-text';
import type { Bible, Book, Chapter, Verse } from '@/schemas/bibles/types';
import { formatISO } from 'date-fns';
import { murmurHash } from 'ohash';

export const versesToDocs = async ({
  bible,
  book,
  chapter,
  verses,
}: {
  bible: Bible;
  book: Book;
  chapter: Omit<Chapter, 'content'>;
  verses: Verse[];
}): Promise<Document[]> => {
  const docs: Document[] = [];
  let i = 0;
  while (i < verses.length) {
    const doc = await processVerseChunk(verses, i, bible, book, chapter);
    if (doc?.metadata?.verseNumbers) {
      docs.push(doc);
      i += (doc.metadata.verseNumbers as number[]).length;
    } else {
      i++; // Move to the next verse if processing failed
    }
  }

  return docs;
};

async function processVerseChunk(
  verses: Verse[],
  startIndex: number,
  bible: Bible,
  book: Book,
  chapter: Omit<Chapter, 'content'>,
): Promise<Document> {
  const verseNumbers = new Set<number>();
  let currentPageContent = '';

  // First pass: collect verses until we hit max tokens
  let currentTokens = 0;
  const maxTokens = embeddingModel.chunkSize;
  let i = startIndex;
  while (i < verses.length && currentTokens < maxTokens) {
    const verse = verses[i];
    const verseText = contentsToText(verse.content).trim();
    const newTokens = await numTokensFromString({ text: verseText });

    if (currentTokens + newTokens > maxTokens) break;

    currentPageContent += `${currentPageContent ? ' ' : ''}${verseText}`;
    verseNumbers.add(verse.number);
    currentTokens += newTokens;
    i++;
  }

  // Add overlap verses from before start if needed
  const overlapTokens = embeddingModel.chunkOverlap;
  let j = startIndex - 1;
  while (j >= 0 && currentTokens < overlapTokens) {
    const verse = verses[j];
    const verseText = contentsToText(verse.content).trim();
    const newTokens = await numTokensFromString({ text: verseText });

    currentPageContent = `${verseText} ${currentPageContent}`;
    verseNumbers.add(verse.number);
    currentTokens += newTokens;
    j--;
  }

  const verseStart = verses[Math.max(0, j + 1)].number;
  const verseEnd = verses[Math.min(verses.length - 1, i - 1)].number;

  currentPageContent = currentPageContent.trim();

  const verseRange = `${verseStart}-${verseEnd}`;
  const name = `${book.shortName} ${chapter.number}:${verseRange} (${bible.abbreviationLocal})`;

  const content = `"${currentPageContent}" - ${name}`;

  const id = `${bible.abbreviation}_${murmurHash(content)}`;

  return {
    id,
    content,
    metadata: {
      type: 'BIBLE',
      category: 'bible',
      bibleAbbreviation: bible.abbreviation,
      bookCode: book.code,
      chapterNumber: chapter.number,
      verseNumbers: Array.from(verseNumbers).sort((a, b) => a - b),
      name,
      url: `/bible/${bible.abbreviation}/${book.code}/${chapter.number}?${Array.from(verseNumbers)
        .sort((a, b) => a - b)
        .map((number) => `verseNumber=${encodeURIComponent(number)}`)
        .join('&')}`,
      indexDate: formatISO(new Date()),
    },
  };
}
