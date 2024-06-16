import { db } from '@lib/server/database';
import { verseHighlights } from '@theaistudybible/core/database/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '~/lib/server/clerk';

export async function updateHighlights({ color, verseIds }: { color: string; verseIds: string[] }) {
  'use server';
  const { isSignedIn, userId } = auth();
  if (!isSignedIn) {
    throw new Error('Not signed in');
  }

  await db
    .insert(verseHighlights)
    .values(
      verseIds.map((id) => ({
        color,
        userId,
        verseId: id
      }))
    )
    .onConflictDoUpdate({
      target: [verseHighlights.id],
      set: {
        color
      }
    })
    .returning();
}

export async function deleteHighlights({ verseIds }: { verseIds: string[] }) {
  'use server';
  const { isSignedIn, userId } = auth();
  if (!isSignedIn) {
    throw new Error('Not signed in');
  }

  await db
    .delete(verseHighlights)
    .where(and(eq(verseHighlights.userId, userId), inArray(verseHighlights.verseId, verseIds)));
}
