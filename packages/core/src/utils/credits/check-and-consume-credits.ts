import { db } from '@/core/database';
import { userCredits } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_CREDITS } from './default';

export async function checkAndConsumeCredits(userId: string, action: 'chat' | 'image') {
  const cost = action === 'chat' ? 1 : 5; // Example: chat costs 1 credit, image generation costs 5
  let [userCredit] = await db.select().from(userCredits).where(eq(userCredits.userId, userId));
  if (!userCredit) {
    [userCredit] = await db
      .insert(userCredits)
      .values({ userId, balance: DEFAULT_CREDITS })
      .returning();
  }
  if (userCredit.balance < cost) {
    return false;
  }
  await db
    .update(userCredits)
    .set({ balance: userCredit.balance - cost })
    .where(eq(userCredits.userId, userId));
  return true;
}
