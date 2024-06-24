import { db } from '@theaistudybible/core/database';

export async function getChapterReaderData(props: {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
}) {
  'use server';
  const bibleBookChapter = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.abbreviation, props.bibleAbbr),
    with: {
      books: {
        limit: 1,
        where: (books, { eq }) => eq(books.abbreviation, props.bookAbbr),
        with: {
          chapters: {
            limit: 1,
            where: (chapters, { eq }) => eq(chapters.number, props.chapterNum),
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
