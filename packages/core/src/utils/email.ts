import { EmailQueueRecordSchema } from '@/email/schemas';
import type { EmailQueueRecord } from '@/email/types';
import { SendMessageBatchCommand, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Resource } from 'sst';
import { sqs } from '../queues';
import { createId } from './id';

export async function queueEmail(email: EmailQueueRecord) {
  const validated = EmailQueueRecordSchema.parse(email);
  const result = await sqs.send(
    new SendMessageCommand({
      QueueUrl: Resource.EmailQueue.url,
      MessageBody: JSON.stringify(validated),
    }),
  );
  return result;
}

export async function queueEmailBatch(emails: EmailQueueRecord[]) {
  if (emails.length > 10) {
    throw new Error('Too many emails to queue');
  }
  const validated = emails.map((email) => EmailQueueRecordSchema.parse(email));
  const result = await sqs.send(
    new SendMessageBatchCommand({
      QueueUrl: Resource.EmailQueue.url,
      Entries: validated.map((email) => ({
        Id: createId(),
        MessageBody: JSON.stringify(email),
      })),
    }),
  );
  return result;
}
