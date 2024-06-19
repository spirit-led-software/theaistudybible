import { Document } from '@langchain/core/documents';
import { Bible, Book, Chapter, Verse } from '@theaistudybible/core/model/bible';
import { Metadata } from '@theaistudybible/core/types/metadata';
import { contentsToText } from '@theaistudybible/core/util/bible';
import { getEmbeddingsModelInfo } from '@theaistudybible/langchain/lib/llm';

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
  const { chunkSize, chunkOverlap } = getEmbeddingsModelInfo();

  const docs: Document<Metadata>[] = [];
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
      pageContent: `${currentPageContent} - ${name}`,
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
