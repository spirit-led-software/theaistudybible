import { db } from '@/core/database';
import { userCredits } from '@/core/database/schema';
import { sql } from 'drizzle-orm';

export const handler = async () => {
  await db.update(userCredits).set({
    balance: sql`${userCredits.balance} + 10`, // Add 10 credits to all users each day
  });
};
