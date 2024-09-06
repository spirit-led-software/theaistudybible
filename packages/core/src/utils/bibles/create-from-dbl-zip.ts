import { vectorStore } from '@/ai/vector-store';
import { db } from '@/core/database';
import * as schema from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import { XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';
import { generateChapterEmbeddings } from './generate-chapter-embeddings';
import type { DBLMetadata, Publication } from './types';
import { parseUsx } from './usx';

/**
 * Create a bible from a DBL zip file.
 */
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
  const zip = await JSZip.loadAsync(zipBuffer);

  const licenseFile = zip.file('license.xml');
  if (!licenseFile) {
    throw new Error('license.xml not found');
  }

  const metadataFile = zip.file('metadata.xml');
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

  const publication = publicationId
    ? metadata.publications.publication.find((pub) => pub['@_id'] === publicationId)
    : metadata.publications.publication.find((pub) => pub['@_default'] === 'true') ||
      metadata.publications.publication[0];

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
    await deleteBibleAndEmbeddings(bible.id);
  }

  bible = await createBible(metadata, abbreviation);
  console.log(`Bible created with ID ${bible.id}`);

  const bookInfos = getBookInfos(publication, metadata);
  const newBooks = await createBooks(bookInfos, bible.id);

  for (const bookInfo of bookInfos) {
    await processBook(bookInfo, newBooks, zip, bible, generateEmbeddings);
  }

  await orderChaptersAndVerses(newBooks);
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
        with: { chaptersToSourceDocuments: { columns: { sourceDocumentId: true } } },
      },
    },
  });

  return (
    bible?.chapters.flatMap((chapter) =>
      chapter.chaptersToSourceDocuments.map((c) => c.sourceDocumentId),
    ) ?? []
  );
}

async function createBible(metadata: DBLMetadata, abbreviation: string) {
  const [bible] = await db
    .insert(schema.bibles)
    .values({
      abbreviation,
      abbreviationLocal: metadata.identification.abbreviationLocal,
      name: metadata.identification.name,
      nameLocal: metadata.identification.nameLocal,
      description: metadata.identification.description,
      languageISO: metadata.language.iso,
      countryISOs: Array.isArray(metadata.countries)
        ? metadata.countries.map((country) => country.iso)
        : [metadata.countries.country.iso],
    })
    .returning();

  return bible;
}

function getBookInfos(publication: Publication, metadata: DBLMetadata) {
  return publication.structure.content.map((content) => {
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
}

async function createBooks(bookInfos: ReturnType<typeof getBookInfos>, bibleId: string) {
  console.log('Creating books...');
  const newBooks = await db
    .insert(schema.books)
    .values(
      bookInfos.map((book, index) => ({
        ...book,
        number: index + 1,
        bibleId,
      })),
    )
    .returning();

  console.log('Creating book order...');
  await Promise.all(
    newBooks.map(async (book, index, books) => {
      const updates: { previousId?: string; nextId?: string } = {};
      if (index > 0) updates.previousId = books[index - 1].id;
      if (index < books.length - 1) updates.nextId = books[index + 1].id;
      if (Object.keys(updates).length) {
        await db.update(schema.books).set(updates).where(eq(schema.books.id, book.id));
      }
    }),
  );

  return newBooks;
}

async function processBook(
  bookInfo: ReturnType<typeof getBookInfos>[0],
  newBooks: Awaited<ReturnType<typeof createBooks>>,
  zip: JSZip,
  bible: Awaited<ReturnType<typeof createBible>>,
  generateEmbeddings: boolean,
) {
  console.log(`Processing book: ${bookInfo.abbreviation}...`);
  const book = newBooks.find((b) => b.abbreviation === bookInfo.abbreviation);
  if (!book) {
    throw new Error(`Book ${bookInfo.abbreviation} not found`);
  }

  const bookFile = zip.file(bookInfo.src);
  if (!bookFile) {
    throw new Error(`Book file ${bookInfo.src} not found`);
  }

  const bookXml = await bookFile.async('text');
  const contents = parseUsx(bookXml);

  console.log(`Book content parsed, inserting chapters into database...`);
  const newChapters = await createChapters(contents, bible.id, book.id, bookInfo);

  console.log(
    `${bookInfo.abbreviation}: Inserted ${newChapters.length} chapters. Inserting verses...`,
  );

  for (const chapter of newChapters) {
    const content = contents[chapter.number];
    await createVerses(chapter, content, bible, book, bookInfo, generateEmbeddings);
  }
}

async function createChapters(
  contents: ReturnType<typeof parseUsx>,
  bibleId: string,
  bookId: string,
  bookInfo: ReturnType<typeof getBookInfos>[0],
) {
  return db
    .insert(schema.chapters)
    .values(
      Object.entries(contents).map(([chapter, content]) => ({
        id: content.id,
        bibleId,
        bookId,
        abbreviation: `${bookInfo.abbreviation.toUpperCase()}.${chapter}`,
        name: `${bookInfo.shortName} ${chapter}`,
        number: parseInt(chapter),
        content: content.contents,
      })),
    )
    .returning();
}

async function createVerses(
  chapter: Awaited<ReturnType<typeof createChapters>>[0],
  content: ReturnType<typeof parseUsx>[keyof ReturnType<typeof parseUsx>],
  bible: Awaited<ReturnType<typeof createBible>>,
  book: Awaited<ReturnType<typeof createBooks>>[0],
  bookInfo: ReturnType<typeof getBookInfos>[0],
  generateEmbeddings: boolean,
) {
  const createdVerses = await db
    .insert(schema.verses)
    .values(
      Object.entries(content.verseContents).map(([verseNumber, verseContent]) => ({
        id: verseContent.id,
        bibleId: bible.id,
        bookId: book.id,
        chapterId: chapter.id,
        abbreviation: `${chapter.abbreviation}.${verseNumber}`,
        name: `${chapter.name}:${verseNumber}`,
        number: parseInt(verseNumber),
        content: verseContent.contents,
      })),
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

  console.log(`${bookInfo.abbreviation}: Inserted ${createdVerses.length} verses`);
}

async function orderChaptersAndVerses(books: Awaited<ReturnType<typeof createBooks>>) {
  const chapterIds = await db.query.chapters.findMany({
    where: (chapters, { inArray }) =>
      inArray(
        chapters.bookId,
        books.map((b) => b.id),
      ),
    columns: { id: true },
    orderBy: (chapters, { asc }) => [asc(chapters.bookId), asc(chapters.number)],
  });

  const verseIds = await db.query.verses.findMany({
    where: (verses, { inArray }) =>
      inArray(
        verses.bookId,
        books.map((b) => b.id),
      ),
    columns: { id: true },
    orderBy: (verses, { asc }) => [asc(verses.bookId), asc(verses.chapterId), asc(verses.number)],
  });

  console.log('Ordering chapters...');
  await updateOrder(chapterIds, schema.chapters);

  console.log('Ordering verses...');
  await updateOrder(verseIds, schema.verses);
}

async function updateOrder<T extends { id: string }>(
  items: T[],
  table: typeof schema.chapters | typeof schema.verses,
) {
  for (let i = 0; i < items.length; i += 40) {
    const chunk = items.slice(i, i + 40);
    await Promise.all(
      chunk.map(async (item, index) => {
        const updates: { previousId?: string; nextId?: string } = {};
        if (index > 0 || i > 0) updates.previousId = chunk[index - 1]?.id || items[i - 1]?.id;
        if (index < chunk.length - 1 || i + 40 < items.length) {
          updates.nextId = chunk[index + 1]?.id || items[i + 40]?.id;
        }
        if (Object.keys(updates).length) {
          await db.update(table).set(updates).where(eq(table.id, item.id));
        }
      }),
    );
  }
}
