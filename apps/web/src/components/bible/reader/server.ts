import { db } from '@lib/server/database';
import { auth } from '~/lib/server/clerk';

export async function getHighlights({ chapterId }: { chapterId: string }) {
  'use server';
  const { isSignedIn, userId } = auth();
  if (!isSignedIn) {
    return [];
  }

  return await db.query.chapterHighlights.findMany({
    where: (chapterHighlights, { and, eq }) =>
      and(eq(chapterHighlights.chapterId, chapterId), eq(chapterHighlights.userId, userId))
  });
}
