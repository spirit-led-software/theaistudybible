import { generateDevotion } from '@/ai/devotion';
import { db } from '@/core/database';
import { queueEmailBatch } from '@/core/utils/email';
import { toTitleCase } from '@/core/utils/string';
import { wrapHandler } from '@sentry/aws-serverless';
import { formatDate } from 'date-fns';

export const handler = wrapHandler(async () => {
  const existingDevotion = await db.query.devotions.findFirst({
    where: (devotions, { sql }) =>
      sql`DATE(${devotions.createdAt}) = ${formatDate(new Date(), 'yyyy-MM-dd')}`,
  });
  if (existingDevotion) {
    return;
  }

  const { image: devotionImage, ...devotion } = await generateDevotion();

  const users = await db.query.userSettings.findMany({
    columns: {},
    where: (userSettings, { eq }) => eq(userSettings.emailNotifications, true),
    with: { user: { columns: { email: true } } },
  });

  const batchSize = 10;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const result = await queueEmailBatch(
      batch.map((user) => ({
        to: [user.user.email],
        subject: `Today's Devotion: ${toTitleCase(devotion.topic)}`,
        body: {
          type: 'daily-devotion',
          devotion,
          devotionImage,
        },
      })),
    );
    if (result.Failed?.length) {
      console.error(JSON.stringify(result.Failed, null, 2));
    }
  }
});
