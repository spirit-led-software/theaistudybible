import { vectorStore } from '@/ai/vector-store';
import { db } from '@/core/database';
import * as schema from '@/core/database/schema';
import { buildConflictUpdateColumns } from '@/core/database/utils';
import type { Bible } from '@/schemas/bibles/types';
import { eq, getTableColumns } from 'drizzle-orm';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';
import { generateChapterEmbeddings } from './generate-chapter-embeddings';
import type { DBLMetadata, Publication } from './types';
import { parseUsx } from './usx';

type CreateBibleParams = {
  zipBuffer: Uint8Array;
  publicationId?: string;
  overwrite: boolean;
  generateEmbeddings: boolean;
};

export async function createBibleFromDblZip({
  zipBuffer,
  publicationId,
  overwrite,
  generateEmbeddings,
}: CreateBibleParams) {
  const zipFile = await JSZip.loadAsync(zipBuffer);
  const { metadata, publication } = await extractMetadataAndPublication(zipFile, publicationId);
  const abbreviation = publication.abbreviation;

  console.log(`Checking if bible ${abbreviation} already exists...`);
  let bible: Bible | undefined = await findExistingBible(abbreviation, overwrite);

  if (!bible) {
    bible = await createNewBible(metadata, abbreviation);
    await createBibleRelations(bible, metadata);
  }

  console.log(`Bible created with ID ${bible.id}`);

  const bookInfos = getBookInfos(publication, metadata);
  const newBooks = await createBooks(bible.id, bookInfos);
  await createBookOrder(newBooks);

  await processBooks(zipFile, bible, newBooks, bookInfos, generateEmbeddings);

  await cleanupMissingChapterLinks(bible.id);
  await cleanupMissingVerseLinks(bible.id);
}

async function extractMetadataAndPublication(zipFile: JSZip, publicationId?: string) {
  const metadataFile = zipFile.file('metadata.xml');
  if (!metadataFile) throw new Error('metadata.xml not found');

  const metadataXml = await metadataFile.async('text');
  const { DBLMetadata: metadata } = new XMLParser({
    ignoreAttributes: false,
    allowBooleanAttributes: true,
  }).parse(metadataXml) as { DBLMetadata: DBLMetadata };

  const publication = findPublication(metadata, publicationId);
  if (!publication) throw new Error('Publication not found');

  return { metadata, publication };
}

function findPublication(metadata: DBLMetadata, publicationId?: string): Publication | undefined {
  if (publicationId) {
    if (Array.isArray(metadata.publications.publication)) {
      return metadata.publications.publication.find((pub) => pub['@_id'] === publicationId);
    }
    return metadata.publications.publication['@_id'] === publicationId
      ? metadata.publications.publication
      : undefined;
  }
  if (Array.isArray(metadata.publications.publication)) {
    return (
      metadata.publications.publication.find((pub) => pub['@_default'] === 'true') ||
      metadata.publications.publication[0]
    );
  }
  return metadata.publications.publication['@_default'] === 'true'
    ? metadata.publications.publication
    : undefined;
}

async function findExistingBible(abbreviation: string, overwrite: boolean) {
  const bible = await db.query.bibles.findFirst({
    where: eq(schema.bibles.abbreviation, abbreviation),
  });

  if (bible && !overwrite) {
    throw new Error(
      `Bible ${abbreviation} already exists. ID: ${bible.id}. Use --overwrite to replace it.`,
    );
  }

  if (bible) {
    console.log(`Bible ${abbreviation} already exists. Deleting...`);
    await deleteBibleAndEmbeddings(bible.id);
    return undefined;
  }

  return bible;
}

async function deleteBibleAndEmbeddings(bibleId: string) {
  const sourceDocIds = await getSourceDocIds(bibleId);
  await Promise.all([
    db.delete(schema.bibles).where(eq(schema.bibles.id, bibleId)),
    sourceDocIds.length && vectorStore.deleteDocuments(sourceDocIds),
  ]);
}

async function getSourceDocIds(bibleId: string) {
  const bible = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.id, bibleId),
    columns: { id: true },
    with: {
      chapters: {
        columns: { id: true },
        with: {
          chaptersToSourceDocuments: {
            columns: { sourceDocumentId: true },
          },
        },
      },
    },
  });

  return (
    bible?.chapters.flatMap((chapter) =>
      chapter.chaptersToSourceDocuments.map((c) => c.sourceDocumentId),
    ) ?? []
  );
}

async function createNewBible(metadata: DBLMetadata, abbreviation: string) {
  const copyRightHtml = new XMLBuilder({
    ignoreAttributes: false,
  }).build(metadata.copyright.fullStatement.statementContent);
  const [bible] = await db
    .insert(schema.bibles)
    .values({
      abbreviation,
      abbreviationLocal: metadata.identification.abbreviationLocal,
      name: metadata.identification.name,
      nameLocal: metadata.identification.nameLocal,
      description: metadata.identification.description,
      copyrightStatement: copyRightHtml,
    })
    .returning();

  return bible;
}

async function createBibleRelations(
  bible: typeof schema.bibles.$inferSelect,
  metadata: DBLMetadata,
) {
  await createBibleLanguage(bible.id, metadata.language);
  await createBibleCountries(bible.id, metadata.countries.country);
  await createBibleRightsHolder(bible.id, metadata.agencies.rightsHolder);
  await createBibleRightsAdmin(bible.id, metadata.agencies.rightsAdmin);
  await createBibleContributor(bible.id, metadata.agencies.contributor);
}

async function createBibleLanguage(bibleId: string, dblLanguage: DBLMetadata['language']) {
  const { iso, ...rest } = dblLanguage;

  const [language] = await db
    .insert(schema.bibleLanguages)
    .values(dblLanguage)
    .onConflictDoUpdate({
      target: [schema.bibleLanguages.iso],
      set: rest,
    })
    .returning();
  await db.insert(schema.biblesToLanguages).values({
    bibleId,
    languageId: language.id,
  });
}

async function createBibleCountries(
  bibleId: string,
  dblCountries: DBLMetadata['countries']['country'],
) {
  const countriesArray = Array.isArray(dblCountries) ? dblCountries : [dblCountries];
  const countries = await db
    .insert(schema.bibleCountries)
    .values(countriesArray)
    .onConflictDoUpdate({
      target: [schema.bibleCountries.iso],
      set: buildConflictUpdateColumns(
        schema.bibleCountries,
        Object.keys(countriesArray[0]).filter((key) =>
          ['id', 'iso', 'createdAt', 'updatedAt'].includes(key),
        ) as (keyof typeof schema.bibleCountries.$inferSelect)[],
      ),
    })
    .returning();
  await db.insert(schema.biblesToCountries).values(
    countries.map((country) => ({
      bibleId,
      countryId: country.id,
    })),
  );
}

async function createBibleRightsHolder(
  bibleId: string,
  dblRightsHolder: DBLMetadata['agencies']['rightsHolder'],
) {
  const { uid, ...rest } = dblRightsHolder;
  const [rightsHolder] = await db
    .insert(schema.bibleRightsHolders)
    .values(dblRightsHolder)
    .onConflictDoUpdate({
      target: [schema.bibleRightsHolders.uid],
      set: rest,
    })
    .returning();
  await db.insert(schema.biblesToRightsHolders).values({
    bibleId,
    rightsHolderId: rightsHolder.id,
  });
}

async function createBibleRightsAdmin(
  bibleId: string,
  dblRightsAdmin: DBLMetadata['agencies']['rightsAdmin'],
) {
  const { uid, ...rest } = dblRightsAdmin;
  const [rightsAdmin] = await db
    .insert(schema.bibleRightsAdmins)
    .values(dblRightsAdmin)
    .onConflictDoUpdate({
      target: [schema.bibleRightsAdmins.uid],
      set: rest,
    })
    .returning();
  await db.insert(schema.biblesToRightsAdmins).values({
    bibleId,
    rightsAdminId: rightsAdmin.id,
  });
}

async function createBibleContributor(
  bibleId: string,
  dblContributor: DBLMetadata['agencies']['contributor'],
) {
  const contributorsArray = Array.isArray(dblContributor) ? dblContributor : [dblContributor];
  const contributors = await db
    .insert(schema.bibleContributors)
    .values(contributorsArray)
    .onConflictDoUpdate({
      target: [schema.bibleContributors.uid],
      set: buildConflictUpdateColumns(
        schema.bibleContributors,
        Object.keys(contributorsArray[0]).filter((key) =>
          ['id', 'uid', 'createdAt', 'updatedAt'].includes(key),
        ) as (keyof typeof schema.bibleContributors.$inferSelect)[],
      ),
    })
    .returning();

  await db.insert(schema.biblesToContributors).values(
    contributors.map((contributor) => ({
      bibleId,
      contributorId: contributor.id,
    })),
  );
}

function getBookInfos(publication: Publication, metadata: DBLMetadata) {
  return publication.structure.content.map((content) => {
    const name = metadata.names.name.find((name) => content['@_name'] === name['@_id']);
    if (!name) throw new Error(`Content ${content['@_name']} not found`);
    return {
      src: content['@_src'],
      code: content['@_role'],
      abbreviation: name.abbr,
      shortName: name.short,
      longName: name.long,
    };
  });
}

async function createBooks(bibleId: string, bookInfos: ReturnType<typeof getBookInfos>) {
  const batchSize = 50;
  const allBooks = [];

  for (let i = 0; i < bookInfos.length; i += batchSize) {
    const batch = bookInfos.slice(i, i + batchSize);
    const insertedBooks = await db
      .insert(schema.books)
      .values(
        batch.map((book, index) => {
          const { src, code, ...rest } = book;
          return {
            ...rest,
            code: code.toUpperCase(),
            number: i + index + 1,
            bibleId,
          };
        }),
      )
      .returning();
    allBooks.push(...insertedBooks);
  }

  return allBooks;
}

async function createBookOrder(books: (typeof schema.books.$inferSelect)[]) {
  const batchSize = 40;
  for (let i = 0; i < books.length; i += batchSize) {
    const batch = books.slice(i, i + batchSize);
    await Promise.all(
      batch.map((book, index) => {
        const previousBook = books[i + index - 1];
        const nextBook = books[i + index + 1];
        const updates: Partial<typeof schema.books.$inferSelect> = {};

        if (previousBook) updates.previousId = previousBook.id;
        if (nextBook) updates.nextId = nextBook.id;

        return db.update(schema.books).set(updates).where(eq(schema.books.id, book.id));
      }),
    );
  }
}

async function processBooks(
  zipFile: JSZip,
  bible: typeof schema.bibles.$inferSelect,
  books: (typeof schema.books.$inferSelect)[],
  bookInfos: ReturnType<typeof getBookInfos>,
  generateEmbeddings: boolean,
) {
  for (const bookInfo of bookInfos) {
    console.log(`Processing book: ${bookInfo.abbreviation}...`);
    const book = books.find((b) => b.abbreviation === bookInfo.abbreviation);
    if (!book) throw new Error(`Book ${bookInfo.abbreviation} not found`);

    const bookFile = zipFile.file(bookInfo.src);
    if (!bookFile) throw new Error(`Book file ${bookInfo.src} not found`);

    const bookXml = await bookFile.async('text');
    const contents = parseUsx(bookXml);

    console.log('Book content parsed, inserting chapters into database...');
    const newChapters = await insertChapters(bible, book, contents);

    console.log(
      `${bookInfo.abbreviation}: Inserted ${newChapters.length} chapters. Inserting verses...`,
    );
    await processChapters(newChapters, contents, bible, book, generateEmbeddings);
  }
}

async function insertChapters(
  bible: typeof schema.bibles.$inferSelect,
  book: typeof schema.books.$inferSelect,
  contents: ReturnType<typeof parseUsx>,
) {
  const { content, ...columnsWithoutContent } = getTableColumns(schema.chapters);
  const insertChapterBatchSize = 40;
  const newChapters = [];
  const chapterEntries = Object.entries(contents);

  for (let i = 0; i < chapterEntries.length; i += insertChapterBatchSize) {
    const chapterBatch = chapterEntries.slice(i, i + insertChapterBatchSize);
    const insertedChapters = await db
      .insert(schema.chapters)
      .values(
        chapterBatch.map(
          ([chapter, content], index) =>
            ({
              id: content.id,
              bibleId: bible.id,
              bookId: book.id,
              previousId: index > 0 ? chapterEntries[index - 1][1].id : undefined,
              nextId:
                index < chapterEntries.length - 1 ? chapterEntries[index + 1][1].id : undefined,
              code: `${book.code}.${chapter}`,
              name: `${book.shortName} ${chapter}`,
              number: Number.parseInt(chapter),
              content: content.contents,
            }) satisfies typeof schema.chapters.$inferInsert,
        ),
      )
      .returning({
        ...columnsWithoutContent,
      });
    newChapters.push(...insertedChapters);
  }

  return newChapters;
}

async function processChapters(
  chapters: Omit<typeof schema.chapters.$inferSelect, 'content'>[],
  contents: ReturnType<typeof parseUsx>,
  bible: typeof schema.bibles.$inferSelect,
  book: typeof schema.books.$inferSelect,
  generateEmbeddings: boolean,
) {
  const batchSize = 10;
  for (let i = 0; i < chapters.length; i += batchSize) {
    const chapterBatch = chapters.slice(i, i + batchSize);

    await Promise.all(
      chapterBatch.map(async (chapter) => {
        const content = contents[chapter.number];
        const createdVerses = await insertVerses(bible, book, chapter, content);
        if (generateEmbeddings) {
          console.log(`Generating embeddings for ${book.code} ${chapter.number}...`);
          await generateChapterEmbeddings({
            verses: createdVerses.map((v) => ({
              ...v,
              content: content.verseContents[v.number].contents,
            })),
            chapter,
            book,
            bible,
          });
        }
        console.log(`Processed chapter ${chapter.number} out of ${chapters.length}`);
      }),
    );

    console.log(
      `Processed batch ${i / batchSize + 1} out of ${Math.ceil(chapters.length / batchSize)}`,
    );
  }
}

async function insertVerses(
  bible: typeof schema.bibles.$inferSelect,
  book: typeof schema.books.$inferSelect,
  chapter: Omit<typeof schema.chapters.$inferSelect, 'content'>,
  content: ReturnType<typeof parseUsx>[number],
) {
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
          ([verseNumber, verseContent], index) =>
            ({
              id: verseContent.id,
              bibleId: bible.id,
              bookId: book.id,
              chapterId: chapter.id,
              previousId: i + index > 0 ? verseEntries[i + index - 1][1].id : undefined,
              nextId:
                i + index < verseEntries.length - 1 ? verseEntries[i + index + 1][1].id : undefined,
              code: `${chapter.code}.${verseNumber}`,
              name: `${chapter.name}:${verseNumber}`,
              number: Number.parseInt(verseNumber),
              content: verseContent.contents,
            }) satisfies typeof schema.verses.$inferInsert,
        ),
      )
      .returning({
        ...columnsWithoutContent,
      });
    allVerses.push(...insertedVerses);
  }

  return allVerses;
}

async function cleanupMissingChapterLinks(bibleId: string) {
  let offset = 0;
  const batchSize = 40;
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

async function cleanupMissingVerseLinks(bibleId: string) {
  let offset = 0;
  const batchSize = 40;
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
