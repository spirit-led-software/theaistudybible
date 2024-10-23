import { db } from '@/core/database';
import { chapters, verses } from '@/core/database/schema';
import { eq } from 'drizzle-orm';

export const removeBibleLinks = async () => {
  const foundBibles = await db.query.bibles.findMany({
    with: { books: { columns: { id: true, code: true } } },
  });
  for (const bible of foundBibles) {
    console.log(`Removing bible links for ${bible.abbreviation}`);
    for (const book of bible.books) {
      console.log(`Removing bible links for book: ${book.code}`);
      const foundChapters = await db.query.chapters.findMany({
        where: (chapters, { eq }) => eq(chapters.bookId, book.id),
        columns: { id: true, code: true, number: true },
        orderBy: (chapters, { asc }) => asc(chapters.number),
      });
      await Promise.all([
        db.update(chapters).set({ previousId: null }).where(eq(chapters.id, foundChapters[0].id)),
        db
          .update(chapters)
          .set({ nextId: null })
          .where(eq(chapters.id, foundChapters[foundChapters.length - 1].id)),
      ]);

      for (const chapter of foundChapters) {
        console.log(`Removing bible links for chapter: ${chapter.code}`);
        const firstVerse = await db.query.verses.findFirst({
          where: (verses, { eq }) => eq(verses.chapterId, chapter.id),
          columns: { id: true, number: true },
          orderBy: (verses, { asc }) => asc(verses.number),
        });
        const lastVerse = await db.query.verses.findFirst({
          where: (verses, { eq }) => eq(verses.chapterId, chapter.id),
          columns: { id: true, number: true },
          orderBy: (verses, { desc }) => desc(verses.number),
        });
        if (!firstVerse || !lastVerse) continue;
        await Promise.all([
          db.update(verses).set({ previousId: null }).where(eq(verses.id, firstVerse.id)),
          db.update(verses).set({ nextId: null }).where(eq(verses.id, lastVerse.id)),
        ]);
        console.log(`Removing bible links for chapter: ${chapter.code} - done`);
      }
      console.log(`Removing bible links for book: ${book.code} - done`);
    }
    console.log(`Removing bible links for bible: ${bible.abbreviation} - done`);
  }
};
