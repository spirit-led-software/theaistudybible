import { db } from '@lib/server/database';
import { BookPickerProps } from './book';
import { ChapterPickerProps } from './chapter';

export async function getBookPickerData({ bibleAbbr, bookAbbr, chapterNum }: BookPickerProps) {
  'use server';
  const [bibleBookChapter, bibleBooks] = await Promise.all([
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
    db.query.bibles.findFirst({
      where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
      with: {
        books: true
      }
    })
  ]);

  const book = bibleBookChapter?.books[0];
  const chapter = book?.chapters[0];

  if (!bibleBookChapter || !book || !chapter || !bibleBooks) {
    throw new Error('Insufficient data');
  }

  return {
    bible: bibleBookChapter,
    book,
    chapter,
    books: bibleBooks.books
  };
}

export async function getChapterPickerData({
  bibleAbbr,
  bookAbbr,
  chapterNum
}: ChapterPickerProps) {
  'use server';
  const [bibleBookChapters, chapter] = await Promise.all([
    db.query.bibles.findFirst({
      where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
      with: {
        books: {
          limit: 1,
          where: (books, { eq }) => eq(books.abbreviation, bookAbbr),
          with: {
            chapters: true
          }
        }
      }
    }),
    db.query.chapters.findFirst({
      where: (chapters, { eq }) => eq(chapters.number, chapterNum)
    })
  ]);

  const book = bibleBookChapters?.books[0];

  if (!bibleBookChapters || !book || !chapter) {
    throw new Error('Insufficient data');
  }

  return {
    bible: bibleBookChapters,
    book,
    chapter
  };
}
