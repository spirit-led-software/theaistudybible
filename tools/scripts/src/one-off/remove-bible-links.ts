import { db } from '@/core/database';
import { chapters, verses } from '@/core/database/schema';
import { eq } from 'drizzle-orm';

export const removeBibleLinks = async () => {
  const foundBibles = await db.query.bibles.findMany({
    with: { books: { columns: { id: true } } },
  });
  for (const bible of foundBibles) {
    for (const book of bible.books) {
      const foundChapters = await db.query.chapters.findMany({
        where: (chapters, { eq }) => eq(chapters.bookId, book.id),
        columns: { id: true, number: true },
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
        const firstVerse = await db.query.verses.findFirst({
          where: (verses, { eq }) => eq(verses.chapterId, chapter.id),
          orderBy: (verses, { asc }) => asc(verses.number),
          columns: { id: true, number: true },
        });
        const lastVerse = await db.query.verses.findFirst({
          where: (verses, { eq }) => eq(verses.chapterId, chapter.id),
          orderBy: (verses, { desc }) => desc(verses.number),
          columns: { id: true, number: true },
        });
        if (!firstVerse || !lastVerse) continue;
        await Promise.all([
          db.update(verses).set({ previousId: null }).where(eq(verses.id, firstVerse.id)),
          db.update(verses).set({ nextId: null }).where(eq(verses.id, lastVerse.id)),
        ]);
      }
    }
  }
};
