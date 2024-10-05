import { sqs } from '@/core/queues';
import { SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import type { SQSHandler } from 'aws-lambda';
import { Resource } from 'sst';

export const handler: SQSHandler = async (event) => {
  console.log('Processing dead-letter event:', JSON.stringify(event, null, 2));

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
    console.log(
      `Failed to send message(s) to email queue: ${response.Failed.map((f) => f.Id).join(', ')}`,
    );
  }
};
