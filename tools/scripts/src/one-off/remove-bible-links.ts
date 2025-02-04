import { db } from '@/core/database';
import { chapters, verses } from '@/core/database/schema';
import { and, eq } from 'drizzle-orm';

export const removeBibleLinks = async () => {
  const foundBibles = await db.query.bibles.findMany({
    with: { books: { columns: { code: true } } },
  });
  for (const bible of foundBibles) {
    console.log(`Removing bible links for ${bible.abbreviation}`);
    for (const book of bible.books) {
      console.log(`Removing bible links for book: ${book.code}`);
      const foundChapters = await db.query.chapters.findMany({
        where: (chapters, { and, eq }) =>
          and(eq(chapters.bookCode, book.code), eq(chapters.bibleAbbreviation, bible.abbreviation)),
        columns: { code: true, number: true },
        orderBy: (chapters, { asc }) => asc(chapters.number),
      });
      await Promise.all([
        db
          .update(chapters)
          .set({ previousCode: null })
          .where(
            and(
              eq(chapters.code, foundChapters[0].code),
              eq(chapters.bibleAbbreviation, bible.abbreviation),
            ),
          ),
        db
          .update(chapters)
          .set({ nextCode: null })
          .where(
            and(
              eq(chapters.code, foundChapters[foundChapters.length - 1].code),
              eq(chapters.bibleAbbreviation, bible.abbreviation),
            ),
          ),
      ]);

      for (const chapter of foundChapters) {
        console.log(`Removing bible links for chapter: ${chapter.code}`);
        const firstVerse = await db.query.verses.findFirst({
          where: (verses, { and, eq }) =>
            and(
              eq(verses.chapterCode, chapter.code),
              eq(verses.bibleAbbreviation, bible.abbreviation),
            ),
          columns: { code: true, number: true },
          orderBy: (verses, { asc }) => asc(verses.number),
        });
        const lastVerse = await db.query.verses.findFirst({
          where: (verses, { and, eq }) =>
            and(
              eq(verses.chapterCode, chapter.code),
              eq(verses.bibleAbbreviation, bible.abbreviation),
            ),
          columns: { code: true, number: true },
          orderBy: (verses, { desc }) => desc(verses.number),
        });
        if (!firstVerse || !lastVerse) continue;
        await Promise.all([
          db
            .update(verses)
            .set({ previousCode: null })
            .where(
              and(
                eq(verses.code, firstVerse.code),
                eq(verses.bibleAbbreviation, bible.abbreviation),
              ),
            ),
          db
            .update(verses)
            .set({ nextCode: null })
            .where(
              and(
                eq(verses.code, lastVerse.code),
                eq(verses.bibleAbbreviation, bible.abbreviation),
              ),
            ),
        ]);
        console.log(`Removing bible links for chapter: ${chapter.code} - done`);
      }
      console.log(`Removing bible links for book: ${book.code} - done`);
    }
    console.log(`Removing bible links for bible: ${bible.abbreviation} - done`);
  }
};
