import { sqs } from '@/core/queues';
import { SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import type { SQSHandler } from 'aws-lambda';
import { Resource } from 'sst';

export const handler: SQSHandler = async (event) => {
  console.log('Processing dead-letter event:', JSON.stringify(event, null, 2));

  try {
    const response = await sqs.send(
      new SendMessageBatchCommand({
        QueueUrl: Resource.EmailQueue.url,
        Entries: event.Records.map((record) => ({
          Id: record.messageId,
          MessageBody: record.body,
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
};
