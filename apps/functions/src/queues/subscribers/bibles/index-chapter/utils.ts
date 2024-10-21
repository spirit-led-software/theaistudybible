import { db } from '@/core/database';
import * as schema from '@/core/database/schema';
import { buildConflictUpdateColumns } from '@/core/database/utils';
import type { parseUsx } from '@/core/utils/bibles/usx';
import type { Bible, Book } from '@/schemas/bibles/types';
import { eq, getTableColumns } from 'drizzle-orm';

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
  const { content, ...columnsWithoutContent } = getTableColumns(schema.chapters);

  const [insertedChapter] = await db
    .insert(schema.chapters)
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
      target: schema.chapters.id,
      set: buildConflictUpdateColumns(schema.chapters, [
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
  bible: typeof schema.bibles.$inferSelect;
  book: typeof schema.books.$inferSelect;
  chapter: Omit<typeof schema.chapters.$inferSelect, 'content'>;
  content: ReturnType<typeof parseUsx>[number];
}) {
  const { content: verseContent, ...columnsWithoutContent } = getTableColumns(schema.verses);
  const insertVerseBatchSize = 40;
  const allVerses = [];
  const verseEntries = Object.entries(content.verseContents);

  for (let i = 0; i < verseEntries.length; i += insertVerseBatchSize) {
    const verseBatch = verseEntries.slice(i, i + insertVerseBatchSize);
    const insertedVerses = await db
      .insert(schema.verses)
      .values(
        verseBatch.map(
          ([verseNumber, verseContent]) =>
            ({
              id: verseContent.id,
              bibleId: bible.id,
              bookId: book.id,
              chapterId: chapter.id,
              previousId: verseEntries.at(i - 1)?.[1].id,
              nextId: verseEntries.at(i + insertVerseBatchSize)?.[1].id,
              code: `${chapter.code}.${verseNumber}`,
              name: `${chapter.name}:${verseNumber}`,
              number: Number.parseInt(verseNumber),
              content: verseContent.contents,
            }) satisfies typeof schema.verses.$inferInsert,
        ),
      )
      // Since the queue can retry, we need to account for conflicts
      .onConflictDoUpdate({
        target: schema.verses.id,
        set: buildConflictUpdateColumns(schema.verses, [
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

export async function cleanupMissingChapterLinks(bibleId: string) {
  let offset = 0;
  const batchSize = 100;
  while (true) {
    const chapters = await db.query.chapters.findMany({
      columns: { id: true, nextId: true, previousId: true },
      where: (chapters, { and, or, eq, isNull }) =>
        and(
          eq(chapters.bibleId, bibleId),
          or(isNull(chapters.nextId), isNull(chapters.previousId)),
        ),
      with: {
        book: {
          columns: { id: true },
          with: {
            next: {
              columns: { id: true },
              with: {
                chapters: {
                  columns: { id: true },
                  orderBy: (chapters, { asc }) => asc(chapters.number),
                  limit: 1,
                },
              },
            },
            previous: {
              columns: { id: true },
              with: {
                chapters: {
                  columns: { id: true },
                  orderBy: (chapters, { desc }) => desc(chapters.number),
                  limit: 1,
                },
              },
            },
          },
        },
      },
      limit: batchSize,
      offset,
    });

    await Promise.all([
      ...chapters
        .filter(
          (chapter) =>
            !chapter.nextId && chapter.book.next !== null && chapter.book.next.chapters.length > 0,
        )
        .map((chapter) =>
          db
            .update(schema.chapters)
            .set({ nextId: chapter.book.next!.chapters[0].id })
            .where(eq(schema.chapters.id, chapter.id)),
        ),
      ...chapters
        .filter(
          (chapter) =>
            !chapter.previousId &&
            chapter.book.previous !== null &&
            chapter.book.previous.chapters.length > 0,
        )
        .map((chapter) =>
          db
            .update(schema.chapters)
            .set({ previousId: chapter.book.previous!.chapters[0].id })
            .where(eq(schema.chapters.id, chapter.id)),
        ),
    ]);

    if (chapters.length < batchSize) break;
    offset += batchSize;
  }
}

export async function cleanupMissingVerseLinks(bibleId: string) {
  let offset = 0;
  const batchSize = 100;
  while (true) {
    const verses = await db.query.verses.findMany({
      columns: { id: true, nextId: true, previousId: true },
      where: (verses, { and, or, eq, isNull }) =>
        and(eq(verses.bibleId, bibleId), or(isNull(verses.nextId), isNull(verses.previousId))),
      with: {
        chapter: {
          columns: { id: true },
          with: {
            next: {
              columns: { id: true },
              with: {
                verses: {
                  columns: { id: true },
                  orderBy: (verses, { asc }) => asc(verses.number),
                  limit: 1,
                },
              },
            },
            previous: {
              columns: { id: true },
              with: {
                verses: {
                  columns: { id: true },
                  orderBy: (verses, { desc }) => desc(verses.number),
                  limit: 1,
                },
              },
            },
          },
        },
      },
      limit: batchSize,
      offset,
    });

    await Promise.all([
      ...verses
        .filter(
          (verse) =>
            !verse.nextId && verse.chapter.next !== null && verse.chapter.next.verses.length > 0,
        )
        .map((verse) =>
          db
            .update(schema.verses)
            .set({ nextId: verse.chapter.next!.verses[0].id })
            .where(eq(schema.verses.id, verse.id)),
        ),
      ...verses
        .filter(
          (verse) =>
            !verse.previousId &&
            verse.chapter.previous !== null &&
            verse.chapter.previous.verses.length > 0,
        )
        .map((verse) =>
          db
            .update(schema.verses)
            .set({ previousId: verse.chapter.previous!.verses[0].id })
            .where(eq(schema.verses.id, verse.id)),
        ),
    ]);

    if (verses.length < batchSize) break;
    offset += batchSize;
  }
}
