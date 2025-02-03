import { db } from '@/core/database';
import { s3 } from '@/core/storage';
import { generateChapterEmbeddings } from '@/core/utils/bibles/generate-chapter-embeddings';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { wrapHandler } from '@sentry/aws-serverless';
import type { S3EventRecord, SQSBatchItemFailure, SQSHandler } from 'aws-lambda';
import type { IndexChapterEvent } from './types';
import { insertChapter, insertVerses } from './utils';

export const handler: SQSHandler = wrapHandler(async (event) => {
  console.log('Processing index bible chapter event:', JSON.stringify(event, null, 2));

  const batchItemFailures: SQSBatchItemFailure[] = [];
  for (const record of event.Records) {
    try {
      const s3Event = JSON.parse(record.body);
      if (s3Event.Event === 's3:TestEvent') {
        continue;
      }
      if (!('Records' in s3Event) || !Array.isArray(s3Event.Records)) {
        throw new Error('Invalid S3 event');
      }

      for (const s3EventRecord of s3Event.Records as S3EventRecord[]) {
        const { Body } = await s3.send(
          new GetObjectCommand({
            Bucket: s3EventRecord.s3.bucket.name,
            Key: s3EventRecord.s3.object.key,
          }),
        );
        if (!Body) throw new Error('Empty file body');

        const messageContent = await Body.transformToString();
        if (!messageContent) {
          throw new Error('Content not found');
        }

        const {
          bibleId,
          bookId,
          previousId,
          nextId,
          chapterNumber,
          content,
          generateEmbeddings,
          overwrite,
        } = JSON.parse(messageContent) as IndexChapterEvent;

        const bibleData = await db.query.bibles.findFirst({
          where: (bibles, { eq }) => eq(bibles.id, bibleId),
          with: {
            books: {
              where: (books, { eq }) => eq(books.id, bookId),
            },
          },
        });
        if (!bibleData) {
          throw new Error('Bible not found');
        }
        const { books, ...bible } = bibleData;
        const book = books[0];
        if (!book) {
          throw new Error('Book not found');
        }

        const chapter = await insertChapter({
          bible,
          book,
          previousId,
          nextId,
          chapterNumber,
          contents: content,
          overwrite,
        });
        const verses = await insertVerses({ bible, book, chapter, content, overwrite });
        if (generateEmbeddings) {
          await generateChapterEmbeddings({
            bible,
            book,
            chapter,
            verses: verses.map((v) => ({
              ...v,
              content: content.verseContents[v.number].contents,
            })),
          });
        }
      }
    } catch (error) {
      console.error('Error processing index bible chapter:', error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
});
