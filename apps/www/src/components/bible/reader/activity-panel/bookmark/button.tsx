import { db } from '@/core/database';
import { verseBookmarks } from '@/core/database/schema';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { useAuth } from 'clerk-solidjs';
import { auth } from 'clerk-solidjs/server';
import { and, eq, inArray } from 'drizzle-orm';
import { Bookmark } from 'lucide-solid';

const getSelectionBookmarked = async (props: { verseIds: string[] }) => {
  'use server';
  if (!props.verseIds.length) {
    return {
      isBookmarked: false,
    };
  }

  const { userId } = auth();
  if (!userId) {
    return {
      isBookmarked: false,
    };
  }

  const bookmarks = await db
    .select()
    .from(verseBookmarks)
    .where(and(eq(verseBookmarks.userId, userId), inArray(verseBookmarks.verseId, props.verseIds)));

  return {
    isBookmarked: bookmarks.length === props.verseIds.length,
  };
};

const bookmarkVerses = async (props: { verseIds: string[] }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  await db
    .insert(verseBookmarks)
    .values(
      props.verseIds.map((verseId) => ({
        verseId,
        userId,
      })),
    )
    .onConflictDoNothing();
};

const unbookmarkVerses = async (props: { verseIds: string[] }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  await db
    .delete(verseBookmarks)
    .where(and(eq(verseBookmarks.userId, userId), inArray(verseBookmarks.verseId, props.verseIds)));
};

export const BookmarkButton = () => {
  const { isSignedIn } = useAuth();
  const [brStore] = useBibleReaderStore();

  const getSelectionBookmarkedQuery = createQuery(() => ({
    queryKey: ['verses-bookmarked', { verseIds: brStore.selectedVerseInfos.map((v) => v.id) }],
    queryFn: () =>
      getSelectionBookmarked({ verseIds: brStore.selectedVerseInfos.map((v) => v.id) }),
  }));

  const bookmarkVersesMutation = createMutation(() => ({
    mutationFn: () => bookmarkVerses({ verseIds: brStore.selectedVerseInfos.map((v) => v.id) }),
    onSettled: () => getSelectionBookmarkedQuery.refetch(),
  }));

  const unbookmarkVersesMutation = createMutation(() => ({
    mutationFn: () => unbookmarkVerses({ verseIds: brStore.selectedVerseInfos.map((v) => v.id) }),
    onSettled: () => getSelectionBookmarkedQuery.refetch(),
  }));

  return (
    <QueryBoundary
      query={getSelectionBookmarkedQuery}
      errorFallback={() => (
        <Button size="icon" disabled>
          <Bookmark size={20} />
        </Button>
      )}
      loadingFallback={
        <Button size="icon" disabled>
          <Bookmark size={20} />
        </Button>
      }
      notFoundFallback={
        <Button size="icon" disabled>
          <Bookmark size={20} />
        </Button>
      }
    >
      {({ isBookmarked }) => (
        <Tooltip>
          <TooltipTrigger
            as={Button}
            size="icon"
            disabled={!isSignedIn()}
            onClick={() => {
              if (isBookmarked) {
                unbookmarkVersesMutation.mutate();
              } else {
                bookmarkVersesMutation.mutate();
              }
            }}
          >
            <Bookmark
              size={20}
              fill={isBookmarked ? 'hsl(var(--primary-foreground))' : undefined}
            />
          </TooltipTrigger>
          <TooltipContent>Bookmark Selection</TooltipContent>
        </Tooltip>
      )}
    </QueryBoundary>
  );
};
