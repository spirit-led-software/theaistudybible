import { queueEmailBatch } from '@/core/utils/email';
import { wrapHandler } from '@sentry/aws-serverless';
import type { SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = wrapHandler(async (event) => {
  try {
    console.log('Processing dead-letter event:', JSON.stringify(event, null, 2));

    const batchSize = 5;
    const errors: Error[] = [];
    for (let i = 0; i < event.Records.length; i += batchSize) {
      const batch = event.Records.slice(i, i + batchSize);
      const response = await queueEmailBatch(
        batch.map((record) => ({
          to: ['admin@theaistudybible.com'],
          subject: 'Dead-letter event',
          body: {
            type: 'dead-letter',
            record: record,
          },
        })),
      );
      if (response.Failed?.length) {
        errors.push(
          new Error(
            `Failed to send message(s) to email queue: ${response.Failed.map((f) => f.Id).join(', ')}`,
          ),
        );
      }
    }

    if (errors.length) {
      throw new AggregateError(errors);
    }
  } catch (error) {
    console.error('Error processing dead-letter event:', error);
    // Don't throw to avoid DLQ infinite retry loop
  }
});
