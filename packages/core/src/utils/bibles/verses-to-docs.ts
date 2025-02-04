import { embeddingModel } from '@/ai/models';
import type { Document } from '@/ai/types/document';
import { numTokensFromString } from '@/ai/utils/num-tokens-from-string';
import { contentsToText } from '@/core/utils/bibles/contents-to-text';
import type { Bible, Book, Chapter, Verse } from '@/schemas/bibles/types';
import { formatISO } from 'date-fns';
import { murmurHash } from 'ohash';

export const versesToDocs = ({
  bible,
  book,
  chapter,
  verses,
}: {
  bible: Bible;
  book: Book;
  chapter: Omit<Chapter, 'content'>;
  verses: Verse[];
}): Document[] => {
  const docs: Document[] = [];
  let i = 0;
  while (i < verses.length) {
    const doc = processVerseChunk(verses, i, bible, book, chapter);
    if (doc?.metadata?.verseIds) {
      docs.push(doc);
      i += (doc.metadata.verseIds as string[]).length;
    } else {
      i++; // Move to the next verse if processing failed
    }
  }

  return docs;
};

function processVerseChunk(
  verses: Verse[],
  startIndex: number,
  bible: Bible,
  book: Book,
  chapter: Omit<Chapter, 'content'>,
): Document {
  const verseNumbers = new Set<number>();
  let currentPageContent = '';

  // First pass: collect verses until we hit max tokens
  let currentTokens = 0;
  const maxTokens = embeddingModel.chunkSize;
  let i = startIndex;
  while (i < verses.length && currentTokens < maxTokens) {
    const verse = verses[i];
    const verseText = contentsToText(verse.content).trim();
    const newTokens = numTokensFromString({ text: verseText });

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
    const newTokens = numTokensFromString({ text: verseText });

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
      type: 'bible',
      bibleAbbreviation: bible.abbreviation,
      bookCode: book.code,
      chapterCode: chapter.code,
      verseNumbers: Array.from(verseNumbers),
      name,
      url: `/bible/${bible.abbreviation}/${book.code}/${chapter.number}?${Array.from(verseNumbers)
        .map((number) => `verseNumber=${encodeURIComponent(number)}`)
        .join('&')}`,
      indexDate: formatISO(new Date()),
    },
  };
}
