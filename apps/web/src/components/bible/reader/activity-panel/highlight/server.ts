import { db } from '@lib/server/database';
import { chapterHighlights } from '@theaistudybible/core/database/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '~/lib/server/clerk';

export async function updateHighlights({
  chapterId,
  color,
  highlightedIds
}: {
  chapterId: string;
  color: string;
  highlightedIds: string[];
}) {
  'use server';
  const { isSignedIn, userId } = auth();
  if (!isSignedIn) {
    throw new Error('Not signed in');
  }

  await db
    .insert(chapterHighlights)
    .values(
      highlightedIds.map((id) => ({
        id,
        color,
        userId,
        chapterId
      }))
    )
    .onConflictDoUpdate({
      target: [chapterHighlights.id],
      set: {
        color
      }
    })
    .returning();
}

export async function deleteHighlights({
  chapterId,
  highlightedIds
}: {
  chapterId: string;
  highlightedIds: string[];
}) {
  'use server';
  const { isSignedIn, userId } = auth();
  if (!isSignedIn) {
    throw new Error('Not signed in');
  }

  await db
    .delete(chapterHighlights)
    .where(
      and(
        eq(chapterHighlights.chapterId, chapterId),
        eq(chapterHighlights.userId, userId),
        inArray(chapterHighlights.id, highlightedIds)
      )
    );
}
