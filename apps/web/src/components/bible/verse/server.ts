import { db } from '@lib/server/database';
import { VerseReaderProps } from './reader';

export const getVerseReaderData = async ({
  bibleAbbr,
  bookAbbr,
  chapterNum,
  verseNum
}: VerseReaderProps) => {
  'use server';
  const bibleBookChapterVerse = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
    with: {
      books: {
        limit: 1,
        where: (books, { eq }) => eq(books.abbreviation, bookAbbr),
        with: {
          chapters: {
            limit: 1,
            where: (chapters, { eq }) => eq(chapters.number, chapterNum),
            with: {
              verses: {
                limit: 1,
                where: (verses, { eq }) => eq(verses.number, verseNum),
                with: {
                  previous: true,
                  next: true
                }
              }
            }
          }
        }
      }
    }
  });
  const book = bibleBookChapterVerse?.books[0];
  const chapter = book?.chapters[0];
  const verse = chapter?.verses[0];

  if (!bibleBookChapterVerse || !book || !chapter || !verse) {
    throw new Error('Insufficient data');
  }

  return {
    bible: bibleBookChapterVerse,
    book,
    chapter,
    verse
  };
};
