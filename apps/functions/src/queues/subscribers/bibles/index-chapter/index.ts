import { db } from '@/core/database';
import { bibles, books } from '@/core/database/schema';
import { s3 } from '@/core/storage';
import { generateChapterEmbeddings } from '@/core/utils/bibles/generate-chapter-embeddings';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { S3EventRecord, SQSBatchItemFailure, SQSHandler } from 'aws-lambda';
import { eq } from 'drizzle-orm';
import type { IndexChapterEvent } from './types';
import {
  cleanupMissingChapterLinks,
  cleanupMissingVerseLinks,
  insertChapter,
  insertVerses,
} from './utils';

export const handler: SQSHandler = async (event) => {
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
        const result = await s3.send(
          new GetObjectCommand({
            Bucket: s3EventRecord.s3.bucket.name,
            Key: s3EventRecord.s3.object.key,
          }),
        );
        const messageContent = await result.Body?.transformToString();
        if (!messageContent) {
          throw new Error('Content not found');
        }

        const { bibleId, bookId, previousId, nextId, chapterNumber, content, generateEmbeddings } =
          JSON.parse(messageContent) as IndexChapterEvent;

        const [bible, book] = await Promise.all([
          db.query.bibles.findFirst({
            where: eq(bibles.id, bibleId),
          }),
          db.query.books.findFirst({
            where: eq(books.id, bookId),
          }),
        ]);
        if (!bible || !book) {
          throw new Error('Bible or book not found');
        }

        const chapter = await insertChapter({
          bible,
          book,
          previousId,
          nextId,
          chapterNumber,
          contents: content,
        });
        const verses = await insertVerses({ bible, book, chapter, content });
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

        await cleanupMissingChapterLinks(bibleId);
        await cleanupMissingVerseLinks(bibleId);
      }
    } catch (error) {
      console.error('Error processing index bible chapter:', error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
