import { db } from '@lib/server/database';
import { auth } from '~/lib/server/clerk';

export async function getHighlights({ chapterId }: { chapterId: string }) {
  'use server';
  const { isSignedIn, userId } = auth();
  if (!isSignedIn) {
    return [];
  }

  return await db.query.chapters
    .findFirst({
      where: (chapters, { eq }) => eq(chapters.id, chapterId),
      with: {
        verses: {
          with: {
            highlights: {
              where: (highlights, { eq }) => eq(highlights.userId, userId)
            }
          }
        }
      }
    })
    .then((chapter) => {
      return chapter?.verses.flatMap((verse) => verse.highlights) || [];
    });
}
