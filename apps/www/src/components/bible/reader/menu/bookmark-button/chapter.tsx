import { db } from '@/core/database';
import { chapterBookmarks } from '@/core/database/schema';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { SignedIn, SignedOut, useAuth } from 'clerk-solidjs';
import { auth } from 'clerk-solidjs/server';
import { and, eq } from 'drizzle-orm';
import { Bookmark } from 'lucide-solid';
import { toast } from 'solid-sonner';

const addBookmark = async (chapterId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  await db.insert(chapterBookmarks).values({ chapterId, userId }).onConflictDoNothing();
};

const deleteBookmark = async (chapterId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  await db
    .delete(chapterBookmarks)
    .where(and(eq(chapterBookmarks.userId, userId), eq(chapterBookmarks.chapterId, chapterId)));
};

const getBookmark = async (chapterId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    return null;
  }
  const bookmark = await db.query.chapterBookmarks.findFirst({
    where: (chapterBookmarks, { and, eq }) =>
      and(eq(chapterBookmarks.userId, userId), eq(chapterBookmarks.chapterId, chapterId)),
  });

  return bookmark ?? null;
};

export const getChapterBookmarkQueryOptions = ({
  userId,
  chapterId,
}: {
  userId?: string | null;
  chapterId: string;
}) => ({
  queryKey: ['bookmark', { chapterId, userId }],
  queryFn: async () => await getBookmark(chapterId),
});

export const ChapterBookmarkButton = () => {
  const { isSignedIn, userId } = useAuth();
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() =>
    getChapterBookmarkQueryOptions({
      userId: userId(),
      chapterId: brStore.chapter.id,
    }),
  );

  const addBookmarkMutation = createMutation(() => ({
    mutationFn: () => addBookmark(brStore.chapter.id),
    onSettled: () => query.refetch(),
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  const deleteBookmarkMutation = createMutation(() => ({
    mutationFn: () => deleteBookmark(brStore.chapter.id),
    onSettled: () => query.refetch(),
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  return (
    <QueryBoundary
      query={query}
      notFoundFallback={
        <Tooltip>
          <TooltipTrigger
            as={Button}
            size="icon"
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
      loadingFallback={
        <Button disabled size="icon">
          <Bookmark />
        </Button>
      }
    >
      {() => (
        <Tooltip>
          <TooltipTrigger
            as={Button}
            size="icon"
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
