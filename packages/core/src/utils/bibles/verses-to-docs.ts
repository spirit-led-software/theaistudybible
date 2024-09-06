import { embeddingsModelInfo } from '@/ai/embeddings';
import type { Document } from '@/ai/types/document';
import { contentsToText } from '@/core/utils/bible';
import { createId } from '@/core/utils/id';
import type { Bible, Book, Chapter, Verse } from '@/schemas/bibles/types';

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
  const { chunkSize, chunkOverlap } = embeddingsModelInfo;

  const docs: Document[] = [];
  let i = 0;
  while (i < verses.length) {
    const doc = processVerseChunk(verses, i, chunkSize, chunkOverlap, bible, book, chapter);
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
  chunkSize: number,
  chunkOverlap: number,
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
    while (j >= 0 && currentPageContent.length < chunkOverlap) {
      const prevVerse = verses[j];
      verseStart = prevVerse.number;
      currentPageContent = `${contentsToText(prevVerse.content)}${currentPageContent}`;
      j--;
    }
    i = j + 1;
  }

  // Handle content
  while (i < verses.length && currentPageContent.length < chunkSize) {
    const verse = verses[i];
    verseEnd = verse.number;
    currentPageContent += contentsToText(verse.content);
    verseIds.push(verse.id);
    i++;
  }

  const verseRange = `${verseStart}-${verseEnd}`;
  const name = `${book.shortName} ${chapter.number}:${verseRange} (${bible.abbreviationLocal})`;

  return {
    id: createId(),
    content: `${currentPageContent} - ${name}`,
    metadata: {
      type: 'bible',
      translation: bible.abbreviation,
      name,
      url: `/bible/${bible.abbreviation}/${book.abbreviation}/${chapter.number}`,
      indexDate: new Date().toISOString(),
      verseRange,
      bibleId: bible.id,
      bookId: book.id,
      chapterId: chapter.id,
      verseIds,
    },
  };
}
