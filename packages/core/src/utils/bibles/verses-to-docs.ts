import { embeddingsModel } from '@/ai/models';
import type { Document } from '@/ai/types/document';
import { numTokensFromString } from '@/ai/utils/num-tokens-from-string';
import { contentsToText } from '@/core/utils/bible';
import type { Bible, Book, Chapter, Verse } from '@/schemas/bibles/types';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

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
}) => {
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
  let verseStart = verses[startIndex].number;
  let verseEnd = verseStart;
  let currentPageContent = '';
  const verseIds: string[] = [];

  // Handle overlap
  let i = startIndex;
  if (i > 0) {
    let j = i - 1;
    while (
      j >= 0 &&
      numTokensFromString({ text: currentPageContent }) < embeddingsModel.chunkOverlap
    ) {
      const prevVerse = verses[j];
      verseStart = prevVerse.number;
      currentPageContent = `${contentsToText(prevVerse.content).trim()} ${currentPageContent}`;
      verseIds.unshift(prevVerse.id);
      j--;
    }
    i = j + 1;
  }

  // Handle content
  while (
    i < verses.length &&
    numTokensFromString({ text: currentPageContent }) < embeddingsModel.chunkSize
  ) {
    const verse = verses[i];
    verseEnd = verse.number;
    currentPageContent += ` ${contentsToText(verse.content).trim()}`;
    verseIds.push(verse.id);
    i++;
  }

  currentPageContent = currentPageContent.trim();

  const verseRange = `${verseStart}-${verseEnd}`;
  const name = `${book.shortName} ${chapter.number}:${verseRange} (${bible.abbreviationLocal})`;

  const content = `"${currentPageContent}" - ${name}`;

  const sha265hasher = sha256.create();
  sha265hasher.outputLen = 12;
  const id = `${bible.abbreviation}_${bytesToHex(sha265hasher.update(content).digest())}`;

  return {
    id,
    content,
    metadata: {
      type: 'bible',
      bibleId: bible.id,
      bookId: book.id,
      chapterId: chapter.id,
      verseIds,
      name,
      url: `/bible/${bible.abbreviation}/${book.code}/${chapter.number}`,
      indexDate: new Date().toISOString(),
    },
  };
}
