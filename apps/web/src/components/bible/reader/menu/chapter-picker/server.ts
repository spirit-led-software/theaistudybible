import { db } from '@theaistudybible/core/database';

export async function getBookPickerData(bibleId: string) {
  'use server';
  const bibleBooks = await db.query.bibles.findFirst({
    where: (bibles, { or, eq }) => or(eq(bibles.abbreviation, bibleId), eq(bibles.id, bibleId)),
    with: {
      books: {
        orderBy: (books, { asc }) => asc(books.number)
      }
    }
  });

  if (!bibleBooks) {
    throw new Error('Insufficient data');
  }

  return bibleBooks.books;
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
