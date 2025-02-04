import { db } from '@/core/database';
import { verseBookmarks } from '@/core/database/schema';
import { QueryBoundary } from '@/www/components/query-boundary';
import { DropdownMenuItem } from '@/www/components/ui/dropdown-menu';
import { useAuth } from '@/www/contexts/auth';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { auth, requireAuth } from '@/www/server/auth';
import { action, useAction } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { and, eq, inArray } from 'drizzle-orm';
import { Bookmark } from 'lucide-solid';
import { toast } from 'solid-sonner';

const getSelectionBookmarked = GET(
  async (props: { bibleAbbreviation: string; verseCodes: string[] }) => {
    'use server';
    if (!props.verseCodes.length) {
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
        and(
          eq(verseBookmarks.userId, user.id),
          eq(verseBookmarks.bibleAbbreviation, props.bibleAbbreviation),
          inArray(verseBookmarks.verseCode, props.verseCodes),
        ),
      );
    return { isBookmarked: bookmarks.length === props.verseCodes.length };
  },
);

const bookmarkVersesAction = action(
  async (props: { bibleAbbreviation: string; verseCodes: string[] }) => {
    'use server';
    const { user } = requireAuth();
    await db
      .insert(verseBookmarks)
      .values(
        props.verseCodes.map((verseCode) => ({
          verseCode,
          userId: user.id,
          bibleAbbreviation: props.bibleAbbreviation,
        })),
      )
      .onConflictDoNothing();
    return { success: true };
  },
);

const unbookmarkVersesAction = action(
  async (props: { bibleAbbreviation: string; verseCodes: string[] }) => {
    'use server';
    const { user } = requireAuth();
    await db
      .delete(verseBookmarks)
      .where(
        and(
          eq(verseBookmarks.userId, user.id),
          eq(verseBookmarks.bibleAbbreviation, props.bibleAbbreviation),
          inArray(verseBookmarks.verseCode, props.verseCodes),
        ),
      );
    return { success: true };
  },
);

export type BookmarkMenuItemProps = {
  onSelect?: () => void;
};

export const BookmarkMenuItem = (props: BookmarkMenuItemProps) => {
  const bookmarkVerses = useAction(bookmarkVersesAction);
  const unbookmarkVerses = useAction(unbookmarkVersesAction);

  const { isSignedIn } = useAuth();
  const [brStore, setBrStore] = useBibleReaderStore();

  const getSelectionBookmarkedQuery = createQuery(() => ({
    queryKey: [
      'verses-bookmarked',
      {
        bibleAbbreviation: brStore.bible.abbreviation,
        verseCodes: brStore.selectedVerseInfos.map((v) => v.code),
      },
    ],
    queryFn: () =>
      getSelectionBookmarked({
        bibleAbbreviation: brStore.bible.abbreviation,
        verseCodes: brStore.selectedVerseInfos.map((v) => v.code),
      }),
  }));

  const bookmarkVersesMutation = createMutation(() => ({
    mutationFn: () =>
      bookmarkVerses({
        bibleAbbreviation: brStore.bible.abbreviation,
        verseCodes: brStore.selectedVerseInfos.map((v) => v.code),
      }),
    onSuccess: () => {
      setBrStore('selectedVerseInfos', []);
    },
    onError: (err) => {
      toast.error(`Failed to bookmark verses: ${err.message}`);
    },
    onSettled: () => getSelectionBookmarkedQuery.refetch(),
  }));

  const unbookmarkVersesMutation = createMutation(() => ({
    mutationFn: () =>
      unbookmarkVerses({
        bibleAbbreviation: brStore.bible.abbreviation,
        verseCodes: brStore.selectedVerseInfos.map((v) => v.code),
      }),
    onSuccess: () => {
      setBrStore('selectedVerseInfos', []);
    },
    onError: (err) => {
      toast.error(`Failed to unbookmark verses: ${err.message}`);
    },
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
