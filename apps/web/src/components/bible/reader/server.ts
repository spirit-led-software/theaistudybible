import { db } from '@theaistudybible/core/database';
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
      columns: {
        id: true
      },
      with: {
        verses: {
          columns: {
            id: true
          },
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
