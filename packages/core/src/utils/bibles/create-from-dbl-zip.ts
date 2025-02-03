import { db } from '@/core/database';
import * as schema from '@/core/database/schema';
import { buildConflictUpdateColumns } from '@/core/database/utils';
import { s3 } from '@/core/storage';
import type { IndexChapterEvent } from '@/functions/queues/subscribers/bibles/index-chapter/types';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { eq, sql } from 'drizzle-orm';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';
import { Resource } from 'sst';
import { createId } from '../id';
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
  const abbreviation = publication.abbreviation ?? metadata.identification.abbreviation;

  console.log(`Checking if bible ${abbreviation} already exists...`);
  let bible = await findExistingBible(abbreviation, overwrite);

  bible = await createBible(metadata, abbreviation, overwrite);
  await createBibleRelations(bible, metadata);

  console.log(`Bible created with ID ${bible.id}`);

  const bookInfos = getBookInfos(publication, metadata);
  const newBooks = await createBooks(bible.id, bookInfos, overwrite);
  await processBooks(zipFile, bible, newBooks, bookInfos, generateEmbeddings, overwrite);
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

  if (bible) {
    if (!overwrite) {
      throw new Error(
        `Bible ${abbreviation} already exists. ID: ${bible.id}. Use --overwrite to replace it.`,
      );
    }
  }

  return bible;
}

async function createBible(metadata: DBLMetadata, abbreviation: string, overwrite: boolean) {
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
    .onConflictDoUpdate({
      target: [schema.bibles.abbreviation],
      set: overwrite
        ? buildConflictUpdateColumns(schema.bibles, [
            'abbreviation',
            'abbreviationLocal',
            'name',
            'nameLocal',
            'description',
            'copyrightStatement',
          ])
        : { id: sql`id` },
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
  await db
    .insert(schema.biblesToLanguages)
    .values({
      bibleId,
      languageId: language.id,
    })
    .onConflictDoNothing();
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
  await db
    .insert(schema.biblesToCountries)
    .values(
      countries.map((country) => ({
        bibleId,
        countryId: country.id,
      })),
    )
    .onConflictDoNothing();
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
  await db
    .insert(schema.biblesToRightsHolders)
    .values({
      bibleId,
      rightsHolderId: rightsHolder.id,
    })
    .onConflictDoNothing();
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
  await db
    .insert(schema.biblesToRightsAdmins)
    .values({
      bibleId,
      rightsAdminId: rightsAdmin.id,
    })
    .onConflictDoNothing();
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

  await db
    .insert(schema.biblesToContributors)
    .values(
      contributors.map((contributor) => ({
        bibleId,
        contributorId: contributor.id,
      })),
    )
    .onConflictDoNothing();
}

function getBookInfos(publication: Publication, metadata: DBLMetadata) {
  return publication.structure.content.map((content) => {
    const name = metadata.names.name.find((name) => content['@_name'] === name['@_id']);
    if (!name) throw new Error(`Content ${content['@_name']} not found`);
    return {
      id: createId(),
      src: content['@_src'],
      code: content['@_role'],
      abbreviation: name.abbr,
      shortName: name.short,
      longName: name.long,
    };
  });
}

async function createBooks(
  bibleId: string,
  bookInfos: ReturnType<typeof getBookInfos>,
  overwrite: boolean,
) {
  const batchSize = 50;
  const allBooks = [];

  for (let i = 0; i < bookInfos.length; i += batchSize) {
    const batch = bookInfos.slice(i, i + batchSize);
    const insertedBooks = await db
      .insert(schema.books)
      .values(
        batch.map((book, idx) => {
          const { id, src, code, ...rest } = book;
          return {
            ...rest,
            id,
            previousId: bookInfos[i + idx - 1]?.id,
            nextId: bookInfos[i + idx + 1]?.id,
            code: code.toUpperCase(),
            number: i + idx + 1,
            bibleId,
          } satisfies typeof schema.books.$inferInsert;
        }),
      )
      .onConflictDoUpdate({
        target: [schema.books.bibleId, schema.books.code],
        set: overwrite
          ? buildConflictUpdateColumns(schema.books, [
              'shortName',
              'longName',
              'abbreviation',
              'number',
            ])
          : { id: sql`id` },
      })
      .returning();
    allBooks.push(...insertedBooks);
  }

  return allBooks;
}

async function processBooks(
  zipFile: JSZip,
  bible: typeof schema.bibles.$inferSelect,
  books: (typeof schema.books.$inferSelect)[],
  bookInfos: ReturnType<typeof getBookInfos>,
  generateEmbeddings: boolean,
  overwrite: boolean,
) {
  for (const bookInfo of bookInfos) {
    console.log(`Processing book: ${bookInfo.code}...`);
    const book = books.find((b) => b.code === bookInfo.code);
    if (!book) throw new Error(`Book ${bookInfo.code} not found`);

    const bookFile = zipFile.file(bookInfo.src);
    if (!bookFile) throw new Error(`Book file ${bookInfo.src} not found`);

    const bookXml = await bookFile.async('text');
    const contents = parseUsx(bookXml);

    console.log('Book content parsed, sending chapters to queue...');
    await sendChaptersToIndexBucket(contents, bible, book, generateEmbeddings, overwrite);
  }
}

async function sendChaptersToIndexBucket(
  contents: ReturnType<typeof parseUsx>,
  bible: typeof schema.bibles.$inferSelect,
  book: typeof schema.books.$inferSelect,
  generateEmbeddings: boolean,
  overwrite: boolean,
) {
  const entries = Object.entries(contents).toSorted(([a], [b]) => Number(a) - Number(b));
  const batchSize = 20;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const messages = batch.map(
      ([chapterNumber, content], idx) =>
        ({
          bibleId: bible.id,
          bookId: book.id,
          previousId: entries[i + idx - 1]?.[1]?.id,
          nextId: entries[i + idx + 1]?.[1]?.id,
          chapterNumber,
          content,
          generateEmbeddings,
          overwrite,
        }) satisfies IndexChapterEvent,
    );

    const uploadPromises = messages.map((message) =>
      s3.send(
        new PutObjectCommand({
          Bucket: Resource.ChapterMessageBucket.name,
          Key: `${message.content.id}.json`,
          Body: JSON.stringify(message),
          ContentType: 'application/json',
        }),
      ),
    );

    const responses = await Promise.all(uploadPromises);

    for (const response of responses) {
      if (response.$metadata.httpStatusCode !== 200) {
        throw new Error('Failed to send message to index queue');
      }
    }
  }
}
