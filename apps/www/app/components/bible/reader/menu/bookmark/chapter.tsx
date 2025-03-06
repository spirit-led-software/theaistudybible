import { db } from '@/core/database';
import { chapterBookmarks } from '@/core/database/schema';
import { QueryBoundary } from '@/www/components/query-boundary';
import { DropdownMenuItem } from '@/www/components/ui/dropdown-menu';
import { Spinner } from '@/www/components/ui/spinner';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { useAuth } from '@/www/hooks/use-auth';
import { authMiddleware, requireAuthMiddleware } from '@/www/server/middleware/auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const getHasBookmark = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(
    z.object({
      bibleAbbreviation: z.string(),
      chapterCode: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { user } = context;
    if (!user) {
      return { hasBookmark: false };
    }

    const bookmark = await db.query.chapterBookmarks.findFirst({
      where: (chapterBookmarks, { and, eq }) =>
        and(
          eq(chapterBookmarks.userId, user.id),
          eq(chapterBookmarks.bibleAbbreviation, data.bibleAbbreviation),
          eq(chapterBookmarks.chapterCode, data.chapterCode),
        ),
    });
    return { hasBookmark: !!bookmark };
  });

const addBookmark = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(
    z.object({
      bibleAbbreviation: z.string(),
      chapterCode: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { user } = context;
    await db
      .insert(chapterBookmarks)
      .values({
        bibleAbbreviation: data.bibleAbbreviation,
        chapterCode: data.chapterCode,
        userId: user.id,
      })
      .onConflictDoNothing();
    return { success: true };
  });

const deleteBookmark = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(
    z.object({
      bibleAbbreviation: z.string(),
      chapterCode: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { user } = context;
    await db
      .delete(chapterBookmarks)
      .where(
        and(
          eq(chapterBookmarks.userId, user.id),
          eq(chapterBookmarks.bibleAbbreviation, data.bibleAbbreviation),
          eq(chapterBookmarks.chapterCode, data.chapterCode),
        ),
      );
    return { success: true };
  });

export const getChapterBookmarkQueryOptions = ({
  bibleAbbreviation,
  chapterCode,
}: {
  bibleAbbreviation: string;
  chapterCode: string;
}) => ({
  queryKey: ['bookmark', { bibleAbbreviation, chapterCode }],
  queryFn: () => getHasBookmark({ data: { bibleAbbreviation, chapterCode } }),
});

export const ChapterBookmarkMenuItem = () => {
  const { isSignedIn } = useAuth();
  const brStore = useBibleReaderStore();

  const query = useQuery(
    getChapterBookmarkQueryOptions({
      bibleAbbreviation: brStore.bible.abbreviation,
      chapterCode: brStore.chapter.code,
    }),
  );

  const addBookmarkMutation = useMutation({
    mutationFn: () =>
      addBookmark({
        data: { bibleAbbreviation: brStore.bible.abbreviation, chapterCode: brStore.chapter.code },
      }),
    onSettled: () => query.refetch(),
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: () =>
      deleteBookmark({
        data: { bibleAbbreviation: brStore.bible.abbreviation, chapterCode: brStore.chapter.code },
      }),
    onSettled: () => query.refetch(),
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <QueryBoundary
      query={query}
      loadingFallback={
        <div className='flex w-full items-center gap-2'>
          <Spinner size='sm' />
          <p>Loading...</p>
        </div>
      }
    >
      {({ hasBookmark }) =>
        hasBookmark ? (
          <DropdownMenuItem
            onSelect={() => deleteBookmarkMutation.mutate()}
            disabled={addBookmarkMutation.isPending || deleteBookmarkMutation.isPending}
          >
            <Bookmark className='mr-2' />
            Remove Bookmark
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => addBookmarkMutation.mutate()}
            disabled={
              !isSignedIn || addBookmarkMutation.isPending || deleteBookmarkMutation.isPending
            }
            className='disabled:pointer-events-auto'
          >
            <Bookmark className='mr-2' />
            Add Bookmark
          </DropdownMenuItem>
        )
      }
    </QueryBoundary>
  );
};
