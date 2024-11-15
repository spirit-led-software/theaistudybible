import { generateDevotion } from '@/ai/devotion';
import { db } from '@/core/database';
import { devotions } from '@/core/database/schema';
import { wrapHandler } from '@sentry/aws-serverless';
import { formatDate } from 'date-fns';
import { sql } from 'drizzle-orm';

export const handler = wrapHandler(async () => {
  const existingDevotion = await db.query.devotions.findFirst({
    where: sql`DATE(${devotions.createdAt}) = ${formatDate(new Date(), 'yyyy-MM-dd')}`,
  });
  if (existingDevotion) {
    return;
  }

  await generateDevotion();
});
