import { db } from '@theaistudybible/core/database';

export const getVerseReaderData = async (props: {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
  verseNum: number;
}) => {
  'use server';
  const bibleBookChapterVerse = await db.query.bibles.findFirst({
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
              verses: {
                limit: 1,
                where: (verses, { eq }) => eq(verses.number, props.verseNum),
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
