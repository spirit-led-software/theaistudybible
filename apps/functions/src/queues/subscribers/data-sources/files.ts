import { embeddingModel } from '@/ai/models';
import { vectorStore } from '@/ai/vector-store';
import { db } from '@/core/database';
import { indexOperations } from '@/core/database/schema';
import { s3 } from '@/core/storage';
import { createId } from '@/core/utils/id';
import { transformKeys } from '@/core/utils/object';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import type { Document } from '@langchain/core/documents';
import { wrapHandler } from '@sentry/aws-serverless';
import type { S3EventRecord, SQSBatchItemFailure, SQSHandler } from 'aws-lambda';
import { eq } from 'drizzle-orm';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export const handler: SQSHandler = wrapHandler(async (event) => {
  console.log('Processing data source files event:', JSON.stringify(event, null, 2));

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
        const bucket = s3EventRecord.s3.bucket.name;
        const key = decodeURIComponent(s3EventRecord.s3.object.key.replace(/\+/g, ' '));

        console.log(`Processing file: ${key} from bucket: ${bucket}`);
        const { Body, ContentType, Metadata } = await s3.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
        );

        if (!Body || !ContentType || !Metadata) {
          throw new Error('Invalid S3 event');
        }

        const transformedMetadata = transformKeys(Metadata, 'toCamel');
        const { name, url, type, dataSourceId } = transformedMetadata;
        if (!name || !url || !type || !dataSourceId) {
          throw new Error('Invalid metadata');
        }

        const [indexOperation] = await db
          .insert(indexOperations)
          .values({
            dataSourceId,
            status: 'RUNNING',
            metadata: transformedMetadata,
          })
          .returning();

        try {
          let docs: Document[] = [];
          if (ContentType === 'application/pdf') {
            const pdfLoader = new PDFLoader(
              new Blob([await Body.transformToByteArray()], { type: 'application/pdf' }),
            );
            docs = await pdfLoader.load();
          } else {
            throw new Error('Unsupported file type');
          }

          const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: embeddingModel.chunkSize,
            chunkOverlap: embeddingModel.chunkOverlap,
          });
          docs = await splitter.splitDocuments(docs);
          docs = docs.map((doc) => {
            let title = name;
            if (doc.metadata.title) {
              title = doc.metadata.title;
              if (doc.metadata.author) {
                title = `${title} by ${doc.metadata.author}`;
              }
            }

            if (doc.metadata.pageNumber) {
              title = `${title} - Page ${doc.metadata.pageNumber}`;
            }

            return {
              pageContent: `From ${title}\n\n${doc.pageContent}`,
              metadata: {
                ...doc.metadata,
                ...transformedMetadata,
              },
            };
          });

          await vectorStore.addDocuments(
            docs.map((doc) => {
              const { pageContent, ...rest } = doc;
              return {
                id: doc.id ?? createId(),
                content: pageContent,
                ...rest,
              };
            }),
          );

          console.log(`Successfully processed ${key}`);
        } catch (error) {
          await db
            .update(indexOperations)
            .set({
              status: 'FAILED',
              errorMessages: [error instanceof Error ? error.message : JSON.stringify(error)],
            })
            .where(eq(indexOperations.id, indexOperation.id));
        }
      }
    } catch (error) {
      console.error('Error processing profile images:', error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
});
