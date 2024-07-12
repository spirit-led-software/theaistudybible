import { createMutation, createQuery } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { verseBookmarks } from '@theaistudybible/core/database/schema';
import { auth, SignedIn, SignedOut, useAuth } from 'clerk-solidjs';
import { and, eq } from 'drizzle-orm';
import { Bookmark } from 'lucide-solid';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { QueryBoundary } from '~/components/query-boundary';
import { Button } from '~/components/ui/button';
import { Spinner } from '~/components/ui/spinner';
import { showToast } from '~/components/ui/toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

const addBookmark = async (verseId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  return await db.insert(verseBookmarks).values({ verseId, userId }).onConflictDoNothing();
};

const deleteBookmark = async (verseId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  return await db
    .delete(verseBookmarks)
    .where(and(eq(verseBookmarks.userId, userId), eq(verseBookmarks.verseId, verseId)));
};

const getBookmark = async (verseId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    return null;
  }

  const bookmark = await db.query.verseBookmarks.findFirst({
    where: (verseBookmarks, { and, eq }) =>
      and(eq(verseBookmarks.userId, userId), eq(verseBookmarks.verseId, verseId))
  });

  return bookmark ?? null;
};

export const getVerseBookmarkQueryOptions = ({
  userId,
  verseId
}: {
  userId?: string | null;
  verseId: string;
}) => ({
  queryKey: ['bookmark', { verseId, userId }],
  queryFn: async () => await getBookmark(verseId)
});

export const VerseBookmarkButton = () => {
  const { isSignedIn, userId } = useAuth();
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() =>
    getVerseBookmarkQueryOptions({
      userId: userId(),
      verseId: brStore.verse!.id
    })
  );

  const addBookmarkMutation = createMutation(() => ({
    mutationFn: () => addBookmark(brStore.verse!.id),
    onSettled: () => query.refetch(),
    onError: (error) => {
      showToast({
        title: error.message,
        variant: 'error'
      });
    }
  }));

  const deleteBookmarkMutation = createMutation(() => ({
    mutationFn: () => deleteBookmark(brStore.verse!.id),
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
