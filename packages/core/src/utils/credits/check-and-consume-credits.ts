import { db } from '@/core/database';
import { userCredits } from '@/core/database/schema';
import { eq } from 'drizzle-orm';

export type Action = 'chat' | 'advanced-chat' | 'image';

export const checkAndConsumeCredits = async (userId: string, action: Action) => {
  const cost = getCost(action);
  let [userCredit] = await db.select().from(userCredits).where(eq(userCredits.userId, userId));
  if (!userCredit) {
    [userCredit] = await db.insert(userCredits).values({ userId, balance: 10 }).returning();
  }
  if (userCredit.balance < cost) {
    return false;
  }
  await db
    .update(userCredits)
    .set({ balance: userCredit.balance - cost })
    .where(eq(userCredits.userId, userId));
  return true;
};

const getCost = (action: Action) => {
  if (action === 'chat') return 1;
  if (action === 'advanced-chat') return 5;
  if (action === 'image') return 10;
  throw new Error(`Unknown action: ${action}`);
};
