import { db } from '@/core/database';
import { chapterBookmarks } from '@/core/database/schema';
import { QueryBoundary } from '@/www/components/query-boundary';
import { DropdownMenuItem } from '@/www/components/ui/dropdown-menu';
import { Spinner } from '@/www/components/ui/spinner';
import {} from '@/www/components/ui/tooltip';
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

const getHasBookmark = GET(async (chapterId: string) => {
  'use server';
  const { user } = auth();
  if (!user) {
    return { hasBookmark: false };
  }

  const bookmark = await db.query.chapterBookmarks.findFirst({
    where: (chapterBookmarks, { and, eq }) =>
      and(eq(chapterBookmarks.userId, user.id), eq(chapterBookmarks.chapterId, chapterId)),
  });
  return { hasBookmark: !!bookmark };
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
  queryFn: () => getHasBookmark(chapterId),
});

export const ChapterBookmarkMenuItem = () => {
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
        <div class='flex w-full items-center gap-2'>
          <Spinner size='sm' />
          <p>Loading...</p>
        </div>
      }
    >
      {({ hasBookmark }) => (
        <Show
          when={hasBookmark}
          fallback={
            <DropdownMenuItem
              onSelect={() => addBookmarkMutation.mutate()}
              disabled={
                !isSignedIn() || addBookmarkMutation.isPending || deleteBookmarkMutation.isPending
              }
              class='disabled:pointer-events-auto'
            >
              <Bookmark class='mr-2' />
              Add Bookmark
            </DropdownMenuItem>
          }
        >
          <DropdownMenuItem
            onSelect={() => deleteBookmarkMutation.mutate()}
            disabled={addBookmarkMutation.isPending || deleteBookmarkMutation.isPending}
          >
            <Bookmark class='mr-2' />
            Remove Bookmark
          </DropdownMenuItem>
        </Show>
      )}
    </QueryBoundary>
  );
};
