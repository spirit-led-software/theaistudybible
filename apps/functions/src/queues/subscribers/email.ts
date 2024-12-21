import { ses } from '@/core/email';
import { EmailQueueRecordSchema } from '@/email/schemas';
import { getEmailHtml } from '@/email/utils/render';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { wrapHandler } from '@sentry/aws-serverless';
import type { SQSBatchItemFailure, SQSHandler } from 'aws-lambda';
import { Resource } from 'sst';

export const handler: SQSHandler = wrapHandler(async (event) => {
  console.log('Processing email event:', JSON.stringify(event, null, 2));

  const batchItemFailures: SQSBatchItemFailure[] = [];
  for (const r of event.Records) {
    try {
      const record = EmailQueueRecordSchema.parse(JSON.parse(r.body));
      const html = await getEmailHtml(record.body);
      const result = await ses.send(
        new SendEmailCommand({
          Source: `"The AI Study Bible" <no-reply@${Resource.Email.sender}>`,
          Destination: {
            ToAddresses: record.to,
            CcAddresses: record.cc,
            BccAddresses: record.bcc,
          },
          Message: {
            Subject: {
              Charset: 'UTF-8',
              Data: record.subject,
            },
            Body: {
              Html: {
                Charset: 'UTF-8',
                Data: html,
              },
            },
          },
          ReplyToAddresses: [`info@${Resource.Email.sender}`],
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
