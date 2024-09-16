import { db } from '@/core/database';
import { readingSessions, userCredits } from '@/core/database/schema';
import { eq, sql } from 'drizzle-orm';
import { auth } from './auth';

export async function startReadingSession() {
  'use server';
  const { user } = auth();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const [session] = await db
    .insert(readingSessions)
    .values({
      userId: user.id,
      startTime: new Date(),
    })
    .returning();

  return session.id;
}

export async function endReadingSession(sessionId: string) {
  'use server';
  const { user } = auth();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const [session] = await db
    .select()
    .from(readingSessions)
    .where(eq(readingSessions.id, sessionId))
    .limit(1);

  if (!session || session.userId !== user.id) {
    throw new Error('Invalid session');
  }

  const endTime = new Date();
  await db.update(readingSessions).set({ endTime }).where(eq(readingSessions.id, sessionId));
}

export async function updateUserCredits(creditsToAdd: number) {
  'use server';
  const { user } = auth();
  if (!user) {
    throw new Error('User not authenticated');
  }

  await db
    .insert(userCredits)
    .values({
      userId: user.id,
      balance: creditsToAdd,
    })
    .onConflictDoUpdate({
      target: [userCredits.userId],
      set: {
        balance: sql`${userCredits.balance} + ${creditsToAdd}`,
        lastReadingCreditAt: new Date(),
      },
    })
    .returning();
}
