import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { SQSBatchItemFailure, SQSHandler } from 'aws-lambda';
import { Resource } from 'sst';
import { EmailQueueRecordSchema } from './schemas';

const ses = new SESClient({});

export const handler: SQSHandler = async (event) => {
  console.log('Email queue consumer event:', JSON.stringify(event, null, 2));

  const batchItemFailures: SQSBatchItemFailure[] = [];
  for (const r of event.Records) {
    try {
      const record = EmailQueueRecordSchema.parse(JSON.parse(r.body));
      const result = await ses.send(
        new SendEmailCommand({
          Source: Resource.Email.sender,
          Destination: {
            ToAddresses: record.to,
            CcAddresses: record.cc,
            BccAddresses: record.bcc,
          },
          Message: {
            Subject: {
              Data: record.subject,
            },
            Body: {
              Html: {
                Data: record.html,
              },
            },
          },
        }),
      );
      if (result.$metadata.httpStatusCode !== 200) {
        throw new Error('Failed to send email', {
          cause: result,
        });
      }
    } catch (error) {
      batchItemFailures.push({ itemIdentifier: r.messageId });
    }
  }

  return { batchItemFailures };
};
