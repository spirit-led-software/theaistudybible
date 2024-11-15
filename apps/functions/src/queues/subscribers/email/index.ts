import { ses } from '@/core/email';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { wrapHandler } from '@sentry/aws-serverless';
import type { SQSBatchItemFailure, SQSHandler } from 'aws-lambda';
import { Resource } from 'sst';
import { EmailQueueRecordSchema } from './schemas';

export const handler: SQSHandler = wrapHandler(async (event) => {
  console.log('Processing email event:', JSON.stringify(event, null, 2));

  const batchItemFailures: SQSBatchItemFailure[] = [];
  for (const r of event.Records) {
    try {
      const record = EmailQueueRecordSchema.parse(JSON.parse(r.body));
      const result = await ses.send(
        new SendEmailCommand({
          Source: `admin@${Resource.Email.sender}`,
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
          ReplyToAddresses: ['info@theaistudybible.com'],
        }),
      );
      if (result.$metadata.httpStatusCode !== 200) {
        throw new Error('Failed to send email', {
          cause: result,
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      batchItemFailures.push({ itemIdentifier: r.messageId });
    }
  }

  return { batchItemFailures };
});
