import * as schema from '@theaistudybible/core/database/schema';
import type { Verse } from '@theaistudybible/core/model/bible';
import { getDocumentVectorStore } from '@theaistudybible/langchain/lib/vector-db';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import JSZip from 'jszip';
import pg from 'pg';
import { Resource } from 'sst';
import { generateChapterEmbeddings } from '../lib/bible/embeddings';
import type { DBLMetadata, Publication } from '../lib/bible/types';
import { parseUsx } from '../lib/bible/usx';

export async function createBible({
  zipPath,
  publicationId,
  overwrite,
  generateEmbeddings
}: {
  zipPath: string;
  publicationId?: string;
  overwrite: boolean;
  generateEmbeddings: boolean;
  embeddingModel?: string;
}) {
  const pool = new pg.Pool({
    connectionString: Resource.NeonBranch.readWriteUrl,
    max: 20
  });
  const db = drizzle(pool, {
    schema
  });

  try {
    const buffer = await fs.readFileSync(zipPath);

    const zip = new JSZip();
    const zipFile = await zip.loadAsync(buffer);

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
      allowBooleanAttributes: true
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
      where: eq(schema.bibles.abbreviation, abbreviation)
    });
    if (bible) {
      if (!overwrite) {
        throw new Error(
          `Bible ${abbreviation} already exists. ID: ${bible.id}. Use --overwrite to replace it.`
        );
      }

      console.log(`Bible ${abbreviation} already exists. Deleting...`);
      const sourceDocIds = await db.query.bibles
        .findFirst({
          where: (bibles, { eq }) => eq(bibles.id, bible!.id),
          columns: {
            id: true
          },
          with: {
            chapters: {
              columns: {
                id: true
              },
              with: {
                chaptersToSourceDocuments: {
                  columns: {
                    sourceDocumentId: true
                  }
                }
              }
            }
          }
        })
        .then(
          (bible) =>
            bible?.chapters
              .map((chapter) => chapter.chaptersToSourceDocuments.map((c) => c.sourceDocumentId))
              .flat() ?? []
        );

      const vectorStore = await getDocumentVectorStore({ write: true });
      await Promise.all([
        db.delete(schema.bibles).where(eq(schema.bibles.id, bible.id)),
        vectorStore.delete(sourceDocIds)
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
        languageISO: metadata.language.iso,
        countryISOs: Array.isArray(metadata.countries)
          ? metadata.countries.map((country) => country.iso)
          : [metadata.countries.country.iso]
      })
      .returning();

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
        longName: name['long']
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
            bibleId: bible.id
          };
        })
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
      })
    );

    let allNewChapterIds: string[] = [];
    let allNewVerseIds: string[] = [];
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
      let newChapters = await db
        .insert(schema.chapters)
        .values(
          Object.entries(contents).map(([chapter, content]) => ({
            id: content.id,
            bibleId: bible.id,
            bookId: book.id,
            abbreviation: `${bookInfo.abbreviation.toUpperCase()}.${chapter}`,
            name: `${bookInfo.shortName} ${chapter}`,
            number: parseInt(chapter),
            content: content.contents
          }))
        )
        .returning();
      newChapters = newChapters.sort((a, b) => a.number - b.number);

      console.log(
        `${bookInfo.abbreviation}: Inserted ${newChapters.length} chapters. Inserting verses...`
      );
      let newVerses: Verse[] = [];
      for (const chapter of newChapters) {
        const content = contents[chapter.number];
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
              content: verseContent.contents
            }))
          )
          .returning();
        newVerses = newVerses.concat(createdVerses.sort((a, b) => a.number - b.number));

        if (generateEmbeddings) {
          console.log(`Generating embeddings for ${bookInfo.abbreviation} ${chapter.number}...`);
          await generateChapterEmbeddings({
            verses: createdVerses,
            chapter,
            book,
            bible
          });
        }
      }
      console.log(`${bookInfo.abbreviation}: Inserted ${newVerses.length} verses`);

      allNewChapterIds = allNewChapterIds.concat(newChapters.map((c) => c.id));
      allNewVerseIds = allNewVerseIds.concat(newVerses.map((v) => v.id));
    }

    console.log('Ordering chapters...');
    for (let i = 0; i < allNewChapterIds.length; i = i + 40) {
      const chunk = allNewChapterIds.slice(i, i + 40);
      await Promise.all(
        chunk.map(async (chapterId, index, chapterIds) => {
          const previousChapterId = chapterIds[index - 1] || allNewChapterIds[i - 1];
          if (previousChapterId) {
            await db
              .update(schema.chapters)
              .set({ previousId: previousChapterId })
              .where(eq(schema.chapters.id, chapterId));
          }

          const nextChapterId = chapterIds[index + 1] || allNewChapterIds[i + 40 + 1];
          if (nextChapterId) {
            await db
              .update(schema.chapters)
              .set({ nextId: nextChapterId })
              .where(eq(schema.chapters.id, chapterId));
          }
        })
      );
    }

    console.log('Ordering verses...');
    for (let i = 0; i < allNewVerseIds.length; i = i + 40) {
      const chunk = allNewVerseIds.slice(i, i + 40);
      await Promise.all(
        chunk.map(async (verseId, index, verseIds) => {
          const previousVerseId = verseIds[index - 1] || allNewVerseIds[i - 1];
          if (previousVerseId) {
            await db
              .update(schema.verses)
              .set({ previousId: previousVerseId })
              .where(eq(schema.verses.id, verseId));
          }

          const nextVerseId = verseIds[index + 1] || allNewVerseIds[i + 40 + 1];
          if (nextVerseId) {
            await db
              .update(schema.verses)
              .set({ nextId: nextVerseId })
              .where(eq(schema.verses.id, verseId));
          }
        })
      );
    }
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    await pool.end();
  }
}
