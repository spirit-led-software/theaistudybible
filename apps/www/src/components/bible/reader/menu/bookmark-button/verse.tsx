import { db } from '@/core/database';
import { verseBookmarks } from '@/core/database/schema';
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

const getBookmark = GET(async (verseId: string) => {
  'use server';
  const { user } = auth();
  if (!user) {
    return { bookmark: null };
  }

  const bookmark = await db.query.verseBookmarks.findFirst({
    where: (verseBookmarks, { and, eq }) =>
      and(eq(verseBookmarks.userId, user.id), eq(verseBookmarks.verseId, verseId)),
  });
  return { bookmark: bookmark ?? null };
});

const addBookmarkAction = action(async (verseId: string) => {
  'use server';
  const { user } = requireAuth();
  await db.insert(verseBookmarks).values({ verseId, userId: user.id }).onConflictDoNothing();
  return { success: true };
});

const deleteBookmarkAction = action(async (verseId: string) => {
  'use server';
  const { user } = requireAuth();
  await db
    .delete(verseBookmarks)
    .where(and(eq(verseBookmarks.userId, user.id), eq(verseBookmarks.verseId, verseId)));
  return { success: true };
});

export const getVerseBookmarkQueryOptions = ({ verseId }: { verseId: string }) => ({
  queryKey: ['bookmark', { verseId }],
  queryFn: () => getBookmark(verseId),
});

export const VerseBookmarkButton = () => {
  const addBookmark = useAction(addBookmarkAction);
  const deleteBookmark = useAction(deleteBookmarkAction);

  const { isSignedIn } = useAuth();
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() =>
    getVerseBookmarkQueryOptions({
      verseId: brStore.verse!.id,
    }),
  );

  const addBookmarkMutation = createMutation(() => ({
    mutationFn: () => addBookmark(brStore.verse!.id),
    onSettled: () => query.refetch(),
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  const deleteBookmarkMutation = createMutation(() => ({
    mutationFn: () => deleteBookmark(brStore.verse!.id),
    onSettled: () => query.refetch(),
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  return (
    <QueryBoundary
      query={query}
      loadingFallback={
        <Button disabled>
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
