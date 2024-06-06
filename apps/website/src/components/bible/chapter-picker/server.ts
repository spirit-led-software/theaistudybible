import { db } from '@lib/server/database';
import { BookPickerProps } from './book';

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
        books: {
          orderBy: (books, { asc }) => asc(books.number)
        }
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

export type GetChapterPickerDataProps = {
  bibleAbbr: string;
  bookAbbr: string;
};

export async function getChapterPickerData({ bibleAbbr, bookAbbr }: GetChapterPickerDataProps) {
  'use server';
  const bibleBookChapters = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
    with: {
      books: {
        limit: 1,
        where: (books, { eq }) => eq(books.abbreviation, bookAbbr),
        with: {
          chapters: {
            orderBy: (chapters, { asc }) => asc(chapters.number),
            columns: {
              content: false
            }
          }
        }
      }
    }
  });

  const book = bibleBookChapters?.books[0];

  if (!book) {
    throw new Error('Insufficient data');
  }

  return book;
}
