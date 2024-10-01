import { db } from '@/core/database';
import { users } from '@/core/database/schema';
import { s3 } from '@/core/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { S3Event, SQSHandler } from 'aws-lambda';
import { eq } from 'drizzle-orm';
import { Resource } from 'sst';

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const s3Event = JSON.parse(record.body) as S3Event;
    for (const s3EventRecord of s3Event.Records) {
      const bucket = s3EventRecord.s3.bucket.name;
      const key = decodeURIComponent(s3EventRecord.s3.object.key.replace(/\+/g, ' '));

      console.log(`Processing file: ${key} from bucket: ${bucket}`);
      const { Metadata } = await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );

      const userId = Metadata?.['user-id'];
      if (!userId) {
        throw new Error('User ID is required');
      }

      await db
        .update(users)
        .set({ image: `${Resource.Cdn.url}/profile-images/${s3EventRecord.s3.object.key}` })
        .where(eq(users.id, userId));

      console.log(`Successfully processed ${key}`);
    }
  }
};
