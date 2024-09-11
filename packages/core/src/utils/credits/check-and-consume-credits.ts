import { db } from '@/core/database';
import { userCredits } from '@/core/database/schema';
import { eq } from 'drizzle-orm';

export async function checkAndConsumeCredits(userId: string, action: 'chat' | 'image') {
  const cost = action === 'chat' ? 1 : 5; // Example: chat costs 1 credit, image generation costs 5
  const [userCredit] = await db.select().from(userCredits).where(eq(userCredits.userId, userId));
  if (!userCredit || userCredit.balance < cost) {
    return false;
  }
  await db
    .update(userCredits)
    .set({ balance: userCredit.balance - cost })
    .where(eq(userCredits.userId, userId));
  return true;
}
