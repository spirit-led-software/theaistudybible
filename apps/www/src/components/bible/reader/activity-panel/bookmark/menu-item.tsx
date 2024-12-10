import { db } from '@/core/database';
import { verseBookmarks } from '@/core/database/schema';
import { QueryBoundary } from '@/www/components/query-boundary';
import { DropdownMenuItem } from '@/www/components/ui/dropdown-menu';
import {} from '@/www/components/ui/tooltip';
import { useAuth } from '@/www/contexts/auth';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { auth, requireAuth } from '@/www/server/auth';
import { action, useAction } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { and, eq, inArray } from 'drizzle-orm';
import { Bookmark } from 'lucide-solid';

const getSelectionBookmarked = GET(async (props: { verseIds: string[] }) => {
  'use server';
  if (!props.verseIds.length) {
    return { isBookmarked: false };
  }

  const { user } = auth();
  if (!user) {
    return { isBookmarked: false };
  }

  const bookmarks = await db
    .select()
    .from(verseBookmarks)
    .where(
      and(eq(verseBookmarks.userId, user.id), inArray(verseBookmarks.verseId, props.verseIds)),
    );
  return { isBookmarked: bookmarks.length === props.verseIds.length };
});

const bookmarkVersesAction = action(async (props: { verseIds: string[] }) => {
  'use server';
  const { user } = requireAuth();
  await db
    .insert(verseBookmarks)
    .values(
      props.verseIds.map((verseId) => ({
        verseId,
        userId: user.id,
      })),
    )
    .onConflictDoNothing();
  return { success: true };
});

const unbookmarkVersesAction = action(async (props: { verseIds: string[] }) => {
  'use server';
  const { user } = requireAuth();
  await db
    .delete(verseBookmarks)
    .where(
      and(eq(verseBookmarks.userId, user.id), inArray(verseBookmarks.verseId, props.verseIds)),
    );
  return { success: true };
});

export type BookmarkMenuItemProps = {
  onSelect?: () => void;
};

export const BookmarkMenuItem = (props: BookmarkMenuItemProps) => {
  const bookmarkVerses = useAction(bookmarkVersesAction);
  const unbookmarkVerses = useAction(unbookmarkVersesAction);

  const { isSignedIn } = useAuth();
  const [brStore] = useBibleReaderStore();

  const getSelectionBookmarkedQuery = createQuery(() => ({
    queryKey: ['verses-bookmarked', { verseIds: brStore.selectedVerseInfos.map((v) => v.id) }],
    queryFn: () =>
      getSelectionBookmarked({
        verseIds: brStore.selectedVerseInfos.map((v) => v.id),
      }),
  }));

  const bookmarkVersesMutation = createMutation(() => ({
    mutationFn: () => bookmarkVerses({ verseIds: brStore.selectedVerseInfos.map((v) => v.id) }),
    onSettled: () => getSelectionBookmarkedQuery.refetch(),
  }));

  const unbookmarkVersesMutation = createMutation(() => ({
    mutationFn: () =>
      unbookmarkVerses({
        verseIds: brStore.selectedVerseInfos.map((v) => v.id),
      }),
    onSettled: () => getSelectionBookmarkedQuery.refetch(),
  }));

  const DisabledMenuItem = () => (
    <DropdownMenuItem onSelect={props.onSelect} disabled>
      <Bookmark class='mr-2' />
      Bookmark
    </DropdownMenuItem>
  );

  return (
    <QueryBoundary
      query={getSelectionBookmarkedQuery}
      errorFallback={() => <DisabledMenuItem />}
      loadingFallback={<DisabledMenuItem />}
    >
      {({ isBookmarked }) => (
        <DropdownMenuItem
          disabled={!isSignedIn()}
          onSelect={() => {
            if (isBookmarked) {
              unbookmarkVersesMutation.mutate();
            } else {
              bookmarkVersesMutation.mutate();
            }
            return props.onSelect?.();
          }}
        >
          <Bookmark class='mr-2' />
          {isBookmarked ? 'Unbookmark' : 'Bookmark'}
        </DropdownMenuItem>
      )}
    </QueryBoundary>
  );
};
