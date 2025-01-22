import { s3 } from '@/core/storage';
import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { wrapHandler } from '@sentry/aws-serverless';
import { Resource } from 'sst';

export const handler = wrapHandler(async () => {
  await cleanupChapterMessageBucket();
});

const cleanupChapterMessageBucket = async () => {
  let continuationToken: string | undefined;
  while (continuationToken) {
    const { Contents, NextContinuationToken } = await s3.send(
      new ListObjectsV2Command({
        Bucket: Resource.ChapterMessageBucket.name,
        ContinuationToken: continuationToken,
      }),
    );
    if (Contents?.length) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: Resource.ChapterMessageBucket.name,
          Delete: { Objects: Contents.map(({ Key }) => ({ Key })) },
        }),
      );
    }
    continuationToken = NextContinuationToken;
  }
};
