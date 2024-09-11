import { vectorStore } from '@/ai/vector-store';
import { db } from '@/core/database';
import * as schema from '@/core/database/schema';
import { eq, getTableColumns } from 'drizzle-orm';
import { XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';
import { generateChapterEmbeddings } from './generate-chapter-embeddings';
import type { DBLMetadata, Publication } from './types';
import { parseUsx } from './usx';

export async function createBibleFromDblZip({
  zipBuffer,
  publicationId,
  overwrite,
  generateEmbeddings,
}: {
  zipBuffer: Uint8Array;
  publicationId?: string;
  overwrite: boolean;
  generateEmbeddings: boolean;
}) {
  const zipFile = await JSZip.loadAsync(zipBuffer);

  const licenseFile = zipFile.file('license.xml');
  if (!licenseFile) {
    throw new Error('license.xml not found');
  }

  const metadataFile = zipFile.file('metadata.xml');
  if (!metadataFile) {
    throw new Error('metadata.xml not found');
  }

  const metadataXml = await metadataFile.async('text');
  const { DBLMetadata: metadata } = new XMLParser({
    ignoreAttributes: false,
    allowBooleanAttributes: true,
  }).parse(metadataXml) as {
    DBLMetadata: DBLMetadata;
  };

  let publication: Publication | undefined;
  if (publicationId) {
    publication = metadata.publications.publication.find((pub) => pub['@_id'] === publicationId);
  } else {
    publication = metadata.publications.publication.find((pub) => pub['@_default'] === 'true');
    if (!publication) {
      publication = metadata.publications.publication[0];
    }
  }
  if (!publication) {
    throw new Error('Publication not found');
  }

  const abbreviation = publication.abbreviation;

  console.log(`Checking if bible ${abbreviation} already exists...`);

  let bible = await db.query.bibles.findFirst({
    where: eq(schema.bibles.abbreviation, abbreviation),
  });
  if (bible) {
    if (!overwrite) {
      throw new Error(
        `Bible ${abbreviation} already exists. ID: ${bible.id}. Use --overwrite to replace it.`,
      );
    }

    console.log(`Bible ${abbreviation} already exists. Deleting...`);
    const sourceDocIds = await db.query.bibles
      .findFirst({
        where: (bibles, { eq }) => eq(bibles.id, bible!.id),
        columns: { id: true },
        with: {
          chapters: {
            columns: { id: true },
            with: { chaptersToSourceDocuments: { columns: { sourceDocumentId: true } } },
          },
        },
      })
      .then(
        (bible) =>
          bible?.chapters
            .map((chapter) => chapter.chaptersToSourceDocuments.map((c) => c.sourceDocumentId))
            .flat() ?? [],
      );

    await Promise.all([
      db.delete(schema.bibles).where(eq(schema.bibles.id, bible.id)),
      sourceDocIds.length && vectorStore.deleteDocuments(sourceDocIds),
    ]);
  }

  [bible] = await db
    .insert(schema.bibles)
    .values({
      abbreviation: abbreviation,
      abbreviationLocal: metadata.identification.abbreviationLocal,
      name: metadata.identification.name,
      nameLocal: metadata.identification.nameLocal,
      description: metadata.identification.description,
      copyrightStatement: metadata.copyright.fullStatement.statementContent.p,
    })
    .returning();

  const [language] = await db
    .insert(schema.bibleLanguages)
    .values(metadata.language)
    .onConflictDoNothing()
    .returning();
  await db.insert(schema.biblesToLanguages).values({
    bibleId: bible.id,
    languageId: language.id,
  });

  const countries = await db
    .insert(schema.bibleCountries)
    .values(
      Array.isArray(metadata.countries)
        ? metadata.countries.map((country) => country)
        : [metadata.countries.country],
    )
    .onConflictDoNothing()
    .returning();
  await db.insert(schema.biblesToCountries).values(
    countries.map((country) => ({
      bibleId: bible.id,
      countryId: country.id,
    })),
  );

  const [rightsHolder] = await db
    .insert(schema.bibleRightsHolders)
    .values(metadata.agencies.rightsHolder)
    .onConflictDoNothing()
    .returning();
  await db.insert(schema.biblesToRightsHolders).values({
    bibleId: bible.id,
    rightsHolderId: rightsHolder.id,
  });

  const [rightsAdmin] = await db
    .insert(schema.bibleRightsAdmins)
    .values(metadata.agencies.rightsAdmin)
    .onConflictDoNothing()
    .returning();
  await db.insert(schema.biblesToRightsAdmins).values({
    bibleId: bible.id,
    rightsAdminId: rightsAdmin.id,
  });

  const [contributor] = await db
    .insert(schema.bibleContributors)
    .values(metadata.agencies.contributor)
    .onConflictDoNothing()
    .returning();
  await db.insert(schema.biblesToContributors).values({
    bibleId: bible.id,
    contributorId: contributor.id,
  });

  console.log(`Bible created with ID ${bible.id}`);

  const bookInfos = publication.structure.content.map((content) => {
    const name = metadata.names.name.find((name) => content['@_name'] === name['@_id']);
    if (!name) {
      throw new Error(`Content ${content['@_name']} not found`);
    }
    return {
      src: content['@_src'],
      abbreviation: name['abbr'].toUpperCase(),
      shortName: name['short'],
      longName: name['long'],
    };
  });

  console.log('Creating books...');
  const newBooks = await db
    .insert(schema.books)
    .values(
      bookInfos.map((book, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { src, ...rest } = book;
        return {
          ...rest,
          number: index + 1,
          bibleId: bible.id,
        };
      }),
    )
    .returning();

  console.log('Creating book order...');
  await Promise.all(
    newBooks.map(async (book, index, books) => {
      const previousBook = books[index - 1];
      if (previousBook) {
        await db
          .update(schema.books)
          .set({ previousId: previousBook.id })
          .where(eq(schema.books.id, book.id));
      }
      const nextBook = books[index + 1];
      if (nextBook) {
        await db
          .update(schema.books)
          .set({ nextId: nextBook.id })
          .where(eq(schema.books.id, book.id));
      }
      return book;
    }),
  );

  for (const bookInfo of bookInfos) {
    console.log(`Processing book: ${bookInfo.abbreviation}...`);
    const book = newBooks.find((book) => book.abbreviation === bookInfo.abbreviation);
    if (!book) {
      throw new Error(`Book ${bookInfo.abbreviation} not found`);
    }

    const bookFile = zipFile.file(bookInfo.src);
    if (!bookFile) {
      throw new Error(`Book file ${bookInfo.src} not found`);
    }
    const bookXml = await bookFile.async('text');
    const contents = parseUsx(bookXml);

    console.log(`Book content parsed, inserting chapters into database...`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content, ...columnsWithoutContent } = getTableColumns(schema.chapters);
    const newChapters = await db
      .insert(schema.chapters)
      .values(
        Object.entries(contents).map(
          ([chapter, content], index, arr) =>
            ({
              id: content.id,
              bibleId: bible.id,
              bookId: book.id,
              previousId: index > 0 ? arr[index - 1][1].id : undefined,
              nextId: index < arr.length - 1 ? arr[index + 1][1].id : undefined,
              abbreviation: `${bookInfo.abbreviation.toUpperCase()}.${chapter}`,
              name: `${bookInfo.shortName} ${chapter}`,
              number: parseInt(chapter),
              content: content.contents,
            }) satisfies typeof schema.chapters.$inferInsert,
        ),
      )
      .returning({
        ...columnsWithoutContent,
      });

    console.log(
      `${bookInfo.abbreviation}: Inserted ${newChapters.length} chapters. Inserting verses...`,
    );

    const chapterBatchSize = 5;
    for (let i = 0; i < newChapters.length; i += chapterBatchSize) {
      const chapterBatch = newChapters.slice(i, i + chapterBatchSize);
      await Promise.all(
        chapterBatch.map(async (chapter) => {
          const content = contents[chapter.number];
          const createdVerses = await db
            .insert(schema.verses)
            .values(
              Object.entries(content.verseContents).map(
                ([verseNumber, verseContent], index, arr) =>
                  ({
                    id: verseContent.id,
                    bibleId: bible.id,
                    bookId: book.id,
                    chapterId: chapter.id,
                    previousId: index > 0 ? arr[index - 1][1].id : undefined,
                    nextId: index < arr.length - 1 ? arr[index + 1][1].id : undefined,
                    abbreviation: `${chapter.abbreviation}.${verseNumber}`,
                    name: `${chapter.name}:${verseNumber}`,
                    number: parseInt(verseNumber),
                    content: verseContent.contents,
                  }) satisfies typeof schema.verses.$inferInsert,
              ),
            )
            .returning();

          if (generateEmbeddings) {
            console.log(`Generating embeddings for ${bookInfo.abbreviation} ${chapter.number}...`);
            await generateChapterEmbeddings({
              verses: createdVerses,
              chapter,
              book,
              bible,
            });
          }
        }),
      );
      console.log(
        `Processed ${Math.min(i + chapterBatchSize, newChapters.length)} chapters out of ${newChapters.length}`,
      );
    }
  }
  await cleanupMissingChapterLinks(bible.id);
  await cleanupMissingVerseLinks(bible.id);
}

async function cleanupMissingChapterLinks(bibleId: string) {
  const chapters = await db.query.chapters.findMany({
    columns: { id: true, nextId: true, previousId: true },
    where: (chapters, { and, or, eq, isNull }) =>
      and(eq(chapters.bibleId, bibleId), or(isNull(chapters.nextId), isNull(chapters.previousId))),
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
  });
  const batchSize = 10;
  for (let i = 0; i < chapters.length; i += batchSize) {
    const batch = chapters.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (chapter) => {
        if (!chapter.nextId && chapter.book.next) {
          await db
            .update(schema.chapters)
            .set({ nextId: chapter.book.next.chapters[0].id })
            .where(eq(schema.chapters.id, chapter.id));
        }
        if (!chapter.previousId && chapter.book.previous) {
          await db
            .update(schema.chapters)
            .set({ previousId: chapter.book.previous.chapters[0].id })
            .where(eq(schema.chapters.id, chapter.id));
        }
      }),
    );
    console.log(
      `Processed ${Math.min(i + batchSize, chapters.length)} chapters out of ${chapters.length}`,
    );
  }
}

async function cleanupMissingVerseLinks(bibleId: string) {
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
  });
  const batchSize = 10;
  for (let i = 0; i < verses.length; i += batchSize) {
    const batch = verses.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (verse) => {
        if (!verse.nextId && verse.chapter.next) {
          await db
            .update(schema.verses)
            .set({ nextId: verse.chapter.next.verses[0].id })
            .where(eq(schema.verses.id, verse.id));
        }
        if (!verse.previousId && verse.chapter.previous) {
          await db
            .update(schema.verses)
            .set({ previousId: verse.chapter.previous.verses[0].id })
            .where(eq(schema.verses.id, verse.id));
        }
      }),
    );
    console.log(
      `Processed ${Math.min(i + batchSize, verses.length)} verses out of ${verses.length}`,
    );
  }
}
