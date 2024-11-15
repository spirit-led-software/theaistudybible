import { db } from '@/core/database';
import { type bibles, type books, chapters, verses } from '@/core/database/schema';
import { buildConflictUpdateColumns } from '@/core/database/utils';
import type { parseUsx } from '@/core/utils/bibles/usx';
import type { Bible, Book } from '@/schemas/bibles/types';
import { getTableColumns } from 'drizzle-orm';

export async function insertChapter({
  bible,
  book,
  previousId,
  nextId,
  chapterNumber,
  contents,
}: {
  bible: Bible;
  book: Book;
  previousId: string | undefined;
  nextId: string | undefined;
  chapterNumber: string;
  contents: ReturnType<typeof parseUsx>[number];
}) {
  const { content, ...columnsWithoutContent } = getTableColumns(chapters);

  const [insertedChapter] = await db
    .insert(chapters)
    .values({
      id: contents.id,
      bibleId: bible.id,
      bookId: book.id,
      previousId,
      nextId,
      code: `${book.code}.${chapterNumber}`,
      name: `${book.shortName} ${chapterNumber}`,
      number: Number.parseInt(chapterNumber),
      content: contents.contents,
    })
    // Since the queue can retry, we need to account for conflicts
    .onConflictDoUpdate({
      target: chapters.id,
      set: buildConflictUpdateColumns(chapters, [
        'code',
        'content',
        'name',
        'number',
        'nextId',
        'previousId',
      ]),
    })
    .returning({
      ...columnsWithoutContent,
    });

  return insertedChapter;
}

export async function insertVerses({
  bible,
  book,
  chapter,
  content,
}: {
  bible: typeof bibles.$inferSelect;
  book: typeof books.$inferSelect;
  chapter: Omit<typeof chapters.$inferSelect, 'content'>;
  content: ReturnType<typeof parseUsx>[number];
}) {
  const { content: verseContent, ...columnsWithoutContent } = getTableColumns(verses);
  const insertVerseBatchSize = 40;
  const allVerses = [];
  const verseEntries = Object.entries(content.verseContents).toSorted(
    ([a], [b]) => Number(a) - Number(b),
  );

  for (let i = 0; i < verseEntries.length; i += insertVerseBatchSize) {
    const verseBatch = verseEntries.slice(i, i + insertVerseBatchSize);
    const insertedVerses = await db
      .insert(verses)
      .values(
        verseBatch.map(
          ([verseNumber, verseContent], idx) =>
            ({
              id: verseContent.id,
              bibleId: bible.id,
              bookId: book.id,
              chapterId: chapter.id,
              previousId: verseEntries[i + idx - 1]?.[1]?.id,
              nextId: verseEntries[i + idx + 1]?.[1]?.id,
              code: `${chapter.code}.${verseNumber}`,
              name: `${chapter.name}:${verseNumber}`,
              number: Number.parseInt(verseNumber),
              content: verseContent.contents,
            }) satisfies typeof verses.$inferInsert,
        ),
      )
      // Since the queue can retry, we need to account for conflicts
      .onConflictDoUpdate({
        target: verses.id,
        set: buildConflictUpdateColumns(verses, [
          'code',
          'content',
          'name',
          'number',
          'nextId',
          'previousId',
        ]),
      })
      .returning({
        ...columnsWithoutContent,
      });
    allVerses.push(...insertedVerses);
  }

  return allVerses;
}
