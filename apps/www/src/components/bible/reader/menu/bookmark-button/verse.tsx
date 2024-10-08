import { db } from '@/core/database';
import { verseBookmarks } from '@/core/database/schema';
import { SignedIn, SignedOut } from '@/www/components/auth/control';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { useAuth } from '@/www/contexts/auth';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { auth, requireAuth } from '@/www/server/auth';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { and, eq } from 'drizzle-orm';
import { Bookmark } from 'lucide-solid';
import { toast } from 'solid-sonner';

const addBookmark = async (verseId: string) => {
  'use server';
  const { user } = requireAuth();
  await db.insert(verseBookmarks).values({ verseId, userId: user.id }).onConflictDoNothing();
  return { success: true };
};

const deleteBookmark = async (verseId: string) => {
  'use server';
  const { user } = requireAuth();
  await db
    .delete(verseBookmarks)
    .where(and(eq(verseBookmarks.userId, user.id), eq(verseBookmarks.verseId, verseId)));
  return { success: true };
};

const getBookmark = async (verseId: string) => {
  'use server';
  const { user } = auth();
  if (!user) {
    return null;
  }

  const bookmark = await db.query.verseBookmarks.findFirst({
    where: (verseBookmarks, { and, eq }) =>
      and(eq(verseBookmarks.userId, user.id), eq(verseBookmarks.verseId, verseId)),
  });

  return bookmark ?? null;
};

export const getVerseBookmarkQueryOptions = ({
  userId,
  verseId,
}: {
  userId?: string | null;
  verseId: string;
}) => ({
  queryKey: ['bookmark', { verseId, userId }],
  queryFn: () => getBookmark(verseId),
});

export const VerseBookmarkButton = () => {
  const { isSignedIn, user } = useAuth();
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() =>
    getVerseBookmarkQueryOptions({
      userId: user()?.id,
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
      notFoundFallback={
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
      loadingFallback={
        <Button disabled>
          <Bookmark />
        </Button>
      }
    >
      {() => (
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
      )}
    </QueryBoundary>
  );
};
