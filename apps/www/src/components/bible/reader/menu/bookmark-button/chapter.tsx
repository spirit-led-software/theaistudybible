import { db } from '@/core/database';
import { chapterBookmarks } from '@/core/database/schema';
import { SignedIn, SignedOut } from '@/www/components/auth/control';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { useAuth } from '@/www/contexts/auth';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { auth } from '@/www/server/auth';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { and, eq } from 'drizzle-orm';
import { Bookmark } from 'lucide-solid';
import { toast } from 'solid-sonner';

const addBookmark = async (chapterId: string) => {
  'use server';
  const { user } = auth();
  if (!user) {
    throw new Error('Not signed in');
  }

  await db.insert(chapterBookmarks).values({ chapterId, userId: user.id }).onConflictDoNothing();

  return { success: true };
};

const deleteBookmark = async (chapterId: string) => {
  'use server';
  const { user } = auth();
  if (!user) {
    throw new Error('Not signed in');
  }

  await db
    .delete(chapterBookmarks)
    .where(and(eq(chapterBookmarks.userId, user.id), eq(chapterBookmarks.chapterId, chapterId)));

  return { success: true };
};

const getBookmark = async (chapterId: string) => {
  'use server';
  const { user } = auth();
  if (!user) {
    return null;
  }
  const bookmark = await db.query.chapterBookmarks.findFirst({
    where: (chapterBookmarks, { and, eq }) =>
      and(eq(chapterBookmarks.userId, user.id), eq(chapterBookmarks.chapterId, chapterId)),
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
  queryFn: () => getBookmark(chapterId),
});

export const ChapterBookmarkButton = () => {
  const { isSignedIn, user } = useAuth();
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() =>
    getChapterBookmarkQueryOptions({
      userId: user()?.id,
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
      loadingFallback={
        <Button disabled size='icon'>
          <Bookmark />
        </Button>
      }
    >
      {() => (
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
      )}
    </QueryBoundary>
  );
};
