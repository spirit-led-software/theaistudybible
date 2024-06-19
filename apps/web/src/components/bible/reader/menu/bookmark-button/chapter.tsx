import { db } from '@lib/server/database';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { chapterBookmarks } from '@theaistudybible/core/database/schema';
import { and, eq } from 'drizzle-orm';
import { Bookmark } from 'lucide-solid';
import { SignedIn, SignedOut } from '~/components/clerk';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { QueryBoundary } from '~/components/query-boundary';
import { Button } from '~/components/ui/button';
import { Spinner } from '~/components/ui/spinner';
import { showToast } from '~/components/ui/toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { useAuth } from '~/hooks/clerk';
import { auth } from '~/lib/server/clerk';

const addBookmark = async (chapterId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  return await db.insert(chapterBookmarks).values({ chapterId, userId }).onConflictDoNothing();
};

const deleteBookmark = async (chapterId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  return await db
    .delete(chapterBookmarks)
    .where(and(eq(chapterBookmarks.userId, userId), eq(chapterBookmarks.chapterId, chapterId)));
};

const getBookmark = async (chapterId: string) => {
  'use server';

  return await db.query.chapterBookmarks.findFirst({
    where: (chapterBookmarks, { eq }) => eq(chapterBookmarks.chapterId, chapterId)
  });
};

export const getChapterBookmarkQueryOptions = ({
  userId,
  chapterId
}: {
  userId?: string;
  chapterId: string;
}) => ({
  queryKey: ['bookmark', { chapterId, userId }],
  queryFn: async () => (await getBookmark(chapterId)) || null
});

export const ChapterBookmarkButton = () => {
  const { isSignedIn, userId } = useAuth();
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() =>
    getChapterBookmarkQueryOptions({
      userId: userId(),
      chapterId: brStore.chapter.id
    })
  );

  const addBookmarkMutation = createMutation(() => ({
    mutationFn: () => addBookmark(brStore.chapter.id),
    onSettled: () => query.refetch(),
    onError: (error) => {
      showToast({
        title: error.message,
        variant: 'error'
      });
    }
  }));

  const deleteBookmarkMutation = createMutation(() => ({
    mutationFn: () => deleteBookmark(brStore.chapter.id),
    onSettled: () => query.refetch(),
    onError: (error) => {
      showToast({
        title: error.message,
        variant: 'error'
      });
    }
  }));

  return (
    <QueryBoundary
      query={query}
      notFoundFallback={
        <Tooltip>
          <TooltipTrigger
            as={Button}
            onClick={() => addBookmarkMutation.mutate()}
            disabled={
              !isSignedIn() || addBookmarkMutation.isPending || deleteBookmarkMutation.isPending
            }
            class="disabled:pointer-events-auto"
          >
            <Bookmark />
          </TooltipTrigger>
          <TooltipContent>
            <SignedIn>
              <p>Add Bookmark</p>
            </SignedIn>
            <SignedOut>
              <p>Sign in to add bookmark</p>
            </SignedOut>
          </TooltipContent>
        </Tooltip>
      }
      loadingFallback={<Spinner size="sm" />}
    >
      {() => (
        <Tooltip>
          <TooltipTrigger
            as={Button}
            onClick={() => deleteBookmarkMutation.mutate()}
            disabled={addBookmarkMutation.isPending || deleteBookmarkMutation.isPending}
          >
            <Bookmark fill="hsl(var(--primary-foreground))" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Remove Bookmark</p>
          </TooltipContent>
        </Tooltip>
      )}
    </QueryBoundary>
  );
};
