import { db } from '@lib/server/database';
import { SmallTranslationPickerProps } from './small';

export async function getSmallPickerData({
  bibleAbbr,
  bookAbbr,
  chapterNum
}: SmallTranslationPickerProps) {
  'use server';
  const [bibleBookChapter, bibles] = await Promise.all([
    db.query.bibles.findFirst({
      where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
      with: {
        books: {
          limit: 1,
          where: (books, { eq }) => eq(books.abbreviation, bookAbbr),
          with: {
            chapters: {
              limit: 1,
              where: (chapters, { eq }) => eq(chapters.number, chapterNum)
            }
          }
        }
      }
    }),
    db.query.bibles.findMany()
  ]);

  const book = bibleBookChapter?.books[0];
  const chapter = book?.chapters[0];

  if (!bibleBookChapter || !book || !chapter || !bibles) {
    throw new Error('Insufficient data');
  }

  return {
    bible: bibleBookChapter,
    book,
    chapter,
    bibles
  };
}
