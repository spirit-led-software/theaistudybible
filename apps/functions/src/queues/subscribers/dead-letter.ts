import '@/functions/sentry.instrumentation';

import { sqs } from '@/core/queues';
import { SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import * as Sentry from '@sentry/aws-serverless';
import type { SQSEvent, SQSHandler } from 'aws-lambda';
import { Resource } from 'sst';
import type { EmailQueueRecord } from './email/types';

const html = (record: SQSEvent['Records'][number]) => `
<html>
  <head>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        background: #f5f5f5;
      }
      h1 {
        color: #e11d48;
        border-bottom: 2px solid #e11d48;
        padding-bottom: 0.5rem;
      }
      pre {
        background: #fff;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        overflow-x: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    </style>
  </head>
  <body>
    <h1>Dead-letter Queue Event</h1>
    <pre>${JSON.stringify(record, null, 2)}</pre>
  </body>
</html>`;

export const handler: SQSHandler = Sentry.wrapHandler(async (event) => {
  try {
    console.log('Processing dead-letter event:', JSON.stringify(event, null, 2));
    const response = await sqs.send(
      new SendMessageBatchCommand({
        QueueUrl: Resource.EmailQueue.url,
        Entries: event.Records.map((record) => ({
          Id: record.messageId,
          MessageBody: JSON.stringify({
            to: ['admin@theaistudybible.com'],
            subject: 'Dead-letter event',
            html: html(record),
          } satisfies EmailQueueRecord),
        })),
      }),
    );
    if (response.Failed?.length) {
      throw new Error(
        `Failed to send message(s) to email queue: ${response.Failed.map((f) => f.Id).join(', ')}`,
      );
    }
  } catch (error) {
    console.error('Error processing dead-letter event:', error);
    // Don't throw to avoid DLQ infinite retry loop
  }
});
