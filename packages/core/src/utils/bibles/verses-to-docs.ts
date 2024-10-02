import { embeddingsModelInfo } from '@/ai/embeddings';
import type { Document } from '@/ai/types/document';
import { contentsToText } from '@/core/utils/bible';
import type { Bible, Book, Chapter, Verse } from '@/schemas/bibles/types';
import { sha256 } from '@noble/hashes/sha256';

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

  const content = `"${currentPageContent}" - ${name}`;
  const id = Buffer.from(sha256(content)).toString('hex');

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
