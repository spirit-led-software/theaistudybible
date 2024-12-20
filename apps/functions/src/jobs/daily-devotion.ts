import { generateDevotion } from '@/ai/devotion';
import { db } from '@/core/database';
import { pushSubscriptions } from '@/core/database/schema';
import { queueEmailBatch } from '@/core/utils/email';
import { toTitleCase } from '@/core/utils/string';
import type { Devotion } from '@/schemas/devotions/types';
import type { DevotionImage } from '@/schemas/devotions/types';
import { wrapHandler } from '@sentry/aws-serverless';
import { formatDate } from 'date-fns';
import { eq } from 'drizzle-orm';
import { Resource } from 'sst';
import webPush from 'web-push';

webPush.setVapidDetails(
  'mailto:support@theaistudybible.com',
  Resource.VapidPublicKey.value,
  Resource.VapidPrivateKey.value,
);

export const handler = wrapHandler(async () => {
  const existingDevotion = await db.query.devotions.findFirst({
    where: (devotions, { sql }) =>
      sql`DATE(${devotions.createdAt}) = ${formatDate(new Date(), 'yyyy-MM-dd')}`,
  });
  if (existingDevotion) return;

  const { image: devotionImage, ...devotion } = await generateDevotion();
  await Promise.all([sendEmails(devotion, devotionImage), sendPushNotifications(devotion)]);
});

const sendEmails = async (devotion: Devotion, devotionImage: DevotionImage) => {
  const users = await db.query.userSettings.findMany({
    where: (userSettings, { eq }) => eq(userSettings.emailNotifications, true),
    columns: {},
    with: { user: { columns: { email: true } } },
  });

  const batchSize = 10;
  const batches = Array.from({ length: Math.ceil(users.length / batchSize) }, (_, i) =>
    users.slice(i * batchSize, (i + 1) * batchSize),
  );
  const results = await Promise.all(
    batches.map((batch) =>
      queueEmailBatch(
        batch.map((user) => ({
          to: [user.user.email],
          subject: `Today's Devotion: ${toTitleCase(devotion.topic)}`,
          body: { type: 'daily-devotion', devotion, devotionImage },
        })),
      ),
    ),
  );
  const failures = results.flatMap((result) => result.Failed || []);
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
  }
};

const sendPushNotifications = async (devotion: Devotion) => {
  const subscriptions = await db.query.pushSubscriptions.findMany({});
  await Promise.all(
    subscriptions.map((subscription) =>
      webPush
        .sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            title: `Today's Devotion: ${toTitleCase(devotion.topic)}`,
            body: devotion.bibleReading,
            url: `${Resource.WebAppUrl.value}/devotion/${devotion.id}`,
          }),
        )
        .catch(async (error) => {
          console.error(error);
          if (error.statusCode === 410) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id));
          }
        }),
    ),
  );
};
