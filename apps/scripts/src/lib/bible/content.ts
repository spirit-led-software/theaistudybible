import { embeddingsModelInfo } from '@theaistudybible/ai/embeddings';
import type { Document } from '@theaistudybible/ai/types/document';
import { Bible, Book, Chapter, Verse } from '@theaistudybible/core/model/bible';
import { contentsToText } from '@theaistudybible/core/util/bible';
import { v4 as uuidV4 } from 'uuid';

export const versesToDocs = ({
  bible,
  book,
  chapter,
  verses
}: {
  bible: Bible;
  book: Book;
  chapter: Chapter;
  verses: Verse[];
}) => {
  const { chunkSize, chunkOverlap } = embeddingsModelInfo;

  const docs: Document[] = [];
  for (let i = 0; i < verses.length; i++) {
    const verse = verses[i];
    let verseStart = verse.number;
    let verseEnd = verseStart;
    let currentPageContent = '';

    // Handle overlap
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

    currentPageContent += contentsToText(verse.content);

    // Handle content
    let j = i + 1;
    while (j < verses.length && currentPageContent.length < chunkSize) {
      const nextVerse = verses[j];
      verseEnd = nextVerse.number;
      currentPageContent += contentsToText(nextVerse.content);
      j++;
    }
    i = j - 1;

    const verseRange = `${verseStart}-${verseEnd - 1}`;
    const name = `${book.shortName} ${chapter.number}:${verseRange} (${bible.abbreviationLocal})`;
    docs.push({
      id: uuidV4(),
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
        verseIds: verses.slice(verseStart - 1, verseEnd).map((verse) => verse.id)
      }
    });
  }

  return docs;
};
