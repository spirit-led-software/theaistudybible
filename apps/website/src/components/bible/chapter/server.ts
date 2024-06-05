import { db } from '@lib/server/database';
import { ChapterReaderProps } from './reader';

export async function getChapterReaderData({
  bibleAbbr,
  bookAbbr,
  chapterNum
}: ChapterReaderProps) {
  'use server';
  const bibleBookChapter = await db.query.bibles.findFirst({
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
              previous: true,
              next: true
            }
          }
        }
      }
    }
  });

  const book = bibleBookChapter?.books[0];
  const chapter = book?.chapters[0];

  if (!bibleBookChapter || !book || !chapter) {
    throw new Error('Insufficient data');
  }

  return {
    bible: bibleBookChapter,
    book,
    chapter
  };
}
