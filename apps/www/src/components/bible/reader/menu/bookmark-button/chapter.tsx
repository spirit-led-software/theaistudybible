import { db } from '@/core/database';
import { chapterBookmarks } from '@/core/database/schema';
import { SignedIn, SignedOut } from '@/www/components/auth/control';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { useAuth } from '@/www/contexts/auth';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { auth, requireAuth } from '@/www/server/auth';
import { action, useAction } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { and, eq } from 'drizzle-orm';
import { Bookmark } from 'lucide-solid';
import { Show } from 'solid-js';
import { toast } from 'solid-sonner';

const getBookmark = GET(async (chapterId: string) => {
  'use server';
  const { user } = auth();
  if (!user) {
    return { bookmark: null };
  }

  const bookmark = await db.query.chapterBookmarks.findFirst({
    where: (chapterBookmarks, { and, eq }) =>
      and(eq(chapterBookmarks.userId, user.id), eq(chapterBookmarks.chapterId, chapterId)),
  });
  return { bookmark: bookmark ?? null };
});

const addBookmarkAction = action(async (chapterId: string) => {
  'use server';
  const { user } = requireAuth();
  await db.insert(chapterBookmarks).values({ chapterId, userId: user.id }).onConflictDoNothing();
  return { success: true };
});

const deleteBookmarkAction = action(async (chapterId: string) => {
  'use server';
  const { user } = requireAuth();
  await db
    .delete(chapterBookmarks)
    .where(and(eq(chapterBookmarks.userId, user.id), eq(chapterBookmarks.chapterId, chapterId)));
  return { success: true };
});

export const getChapterBookmarkQueryOptions = ({ chapterId }: { chapterId: string }) => ({
  queryKey: ['bookmark', { chapterId }],
  queryFn: () => getBookmark(chapterId),
});

export const ChapterBookmarkButton = () => {
  const addBookmark = useAction(addBookmarkAction);
  const deleteBookmark = useAction(deleteBookmarkAction);

  const { isSignedIn } = useAuth();
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() =>
    getChapterBookmarkQueryOptions({
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
      loadingFallback={
        <Button disabled size='icon'>
          <Bookmark />
        </Button>
      }
    >
      {({ bookmark }) => (
        <Show
          when={bookmark}
          fallback={
            <Tooltip>
              <TooltipTrigger
                as={Button}
                size='icon'
                onClick={() => addBookmarkMutation.mutate()}
                disabled={
                  !isSignedIn() || addBookmarkMutation.isPending || deleteBookmarkMutation.isPending
                }
                class='disabled:pointer-events-auto'
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
        >
          <Tooltip>
            <TooltipTrigger
              as={Button}
              size='icon'
              onClick={() => deleteBookmarkMutation.mutate()}
              disabled={addBookmarkMutation.isPending || deleteBookmarkMutation.isPending}
            >
              <Bookmark fill='hsl(var(--primary-foreground))' />
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove Bookmark</p>
            </TooltipContent>
          </Tooltip>
        </Show>
      )}
    </QueryBoundary>
  );
};
