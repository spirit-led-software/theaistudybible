import { db } from '@/core/database';
import { type bibles, type books, chapters, verses } from '@/core/database/schema';
import { buildConflictUpdateColumns } from '@/core/database/utils';
import type { parseUsx } from '@/core/utils/bibles/usx';
import type { Bible, Book } from '@/schemas/bibles/types';
import { getTableColumns, sql } from 'drizzle-orm';

export async function insertChapter({
  bible,
  book,
  previousCode,
  nextCode,
  chapterNumber,
  contents,
  overwrite,
}: {
  bible: Bible;
  book: Book;
  previousCode: string | undefined;
  nextCode: string | undefined;
  chapterNumber: string;
  contents: ReturnType<typeof parseUsx>[number];
  overwrite: boolean;
}) {
  const { content, ...columnsWithoutContent } = getTableColumns(chapters);

  const [insertedChapter] = await db
    .insert(chapters)
    .values({
      bibleAbbreviation: bible.abbreviation,
      bookCode: book.code,
      previousCode,
      nextCode,
      code: `${book.code}.${chapterNumber}`,
      name: `${book.shortName} ${chapterNumber}`,
      number: Number.parseInt(chapterNumber),
      content: contents.contents,
    })
    .onConflictDoUpdate({
      target: [chapters.bibleAbbreviation, chapters.code],
      set: overwrite
        ? buildConflictUpdateColumns(chapters, [
            'previousCode',
            'nextCode',
            'name',
            'number',
            'content',
          ])
        : { code: sql`code` },
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
  overwrite,
}: {
  bible: typeof bibles.$inferSelect;
  book: typeof books.$inferSelect;
  chapter: Omit<typeof chapters.$inferSelect, 'content'>;
  content: ReturnType<typeof parseUsx>[number];
  overwrite: boolean;
}) {
  const { content: verseContent, ...columnsWithoutContent } = getTableColumns(verses);
  const insertVerseBatchSize = 50;
  const allVerses = [];
  const verseEntries = Object.entries(content.verseContents).sort(
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
              bibleAbbreviation: bible.abbreviation,
              bookCode: book.code,
              chapterCode: chapter.code,
              previousCode: verseEntries[i + idx - 1]?.[1]?.code,
              nextCode: verseEntries[i + idx + 1]?.[1]?.code,
              code: `${chapter.code}.${verseNumber}`,
              name: `${chapter.name}:${verseNumber}`,
              number: Number.parseInt(verseNumber),
              content: verseContent.contents,
            }) satisfies typeof verses.$inferInsert,
        ),
      )
      .onConflictDoUpdate({
        target: [verses.bibleAbbreviation, verses.code],
        set: overwrite
          ? buildConflictUpdateColumns(verses, [
              'previousCode',
              'nextCode',
              'name',
              'number',
              'content',
            ])
          : { code: sql`code` },
      })
      .returning({
        ...columnsWithoutContent,
      });
    allVerses.push(...insertedVerses);
  }

  return allVerses;
}
