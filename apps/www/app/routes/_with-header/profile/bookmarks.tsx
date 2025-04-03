import { db } from '@/core/database';
import {
  bibles as biblesTable,
  books as booksTable,
  chapterBookmarks,
  chapters as chaptersTable,
} from '@/core/database/schema';
import { ilike } from '@/core/database/utils';
import { contentsToText } from '@/core/utils/bibles/contents-to-text';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/www/components/ui/dialog';
import { Input } from '@/www/components/ui/input';
import { Spinner } from '@/www/components/ui/spinner';
import { H2, H6, P } from '@/www/components/ui/typography';
import { authMiddleware, requireAuthMiddleware } from '@/www/server/middleware/auth';
import { getHighlightedContent } from '@/www/utils/get-highlighted-content';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, getTableColumns, or } from 'drizzle-orm';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

export const Route = createFileRoute('/_with-header/profile/bookmarks')({
  head: () => {
    const title = 'Bible Bookmarks | The AI Study Bible - Save Your Reading Progress';
    const description =
      'Access your saved Bible bookmarks. Keep track of chapters and verses for easy reference and continue your Bible study journey where you left off.';

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { name: 'og:title', content: title },
        { name: 'og:description', content: description },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
    };
  },
  component: RouteComponent,
});

const getBookmarks = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(
    z.object({
      limit: z.number(),
      offset: z.number(),
      search: z.string().optional(),
    }),
  )
  .handler(async ({ data: { limit, offset, search }, context }) => {
    'use server';
    const { user } = context;
    if (!user) {
      return { bookmarks: [], nextCursor: null };
    }

    const joinCondition = and(
      eq(chapterBookmarks.bibleAbbreviation, chaptersTable.bibleAbbreviation),
      eq(chapterBookmarks.chapterCode, chaptersTable.code),
    );

    const query = db
      .select({
        ...getTableColumns(chapterBookmarks),
        chapter: {
          code: chaptersTable.code,
          name: chaptersTable.name,
          number: chaptersTable.number,
          content: chaptersTable.content,
        },
        bible: { abbreviation: biblesTable.abbreviation },
        book: { code: booksTable.code },
      })
      .from(chapterBookmarks)
      .where(eq(chapterBookmarks.userId, user.id))
      .innerJoin(chaptersTable, joinCondition)
      .innerJoin(biblesTable, eq(chapterBookmarks.bibleAbbreviation, biblesTable.abbreviation))
      .innerJoin(
        booksTable,
        and(
          eq(chaptersTable.bookCode, booksTable.code),
          eq(chaptersTable.bibleAbbreviation, booksTable.bibleAbbreviation),
        ),
      )
      .orderBy(desc(chapterBookmarks.createdAt))
      .limit(limit)
      .offset(offset)
      .$dynamic();

    if (search) {
      query.where(
        or(
          ilike(chaptersTable.bibleAbbreviation, `%${search}%`),
          ilike(chaptersTable.name, `%${search}%`),
          ilike(chaptersTable.content, `%${search}%`),
        ),
      );
    }

    const bookmarks = await query.execute();

    return {
      bookmarks,
      nextCursor: bookmarks.length === limit ? offset + limit : null,
    };
  });

const deleteBookmark = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(
    z.object({
      bibleAbbreviation: z.string(),
      code: z.string(),
    }),
  )
  .handler(async ({ data: { bibleAbbreviation, code }, context }) => {
    'use server';
    const { user } = context;
    await db
      .delete(chapterBookmarks)
      .where(
        and(
          eq(chapterBookmarks.userId, user.id),
          eq(chapterBookmarks.bibleAbbreviation, bibleAbbreviation),
          eq(chapterBookmarks.chapterCode, code),
        ),
      );
    return { success: true };
  });

const getBookmarksQueryOptions = (input: { search?: string } = {}) => ({
  queryKey: ['bookmarks', input],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getBookmarks({ data: { limit: 9, offset: pageParam, search: input.search } }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: { nextCursor: number | null }) => lastPage.nextCursor,
});

function RouteComponent() {
  const [search, setSearch] = useState('');

  const bookmarksQuery = useInfiniteQuery({
    ...getBookmarksQueryOptions({ search }),
    placeholderData: (prev) => prev,
  });

  const queryClient = useQueryClient();
  const deleteBookmarkMutation = useMutation({
    mutationFn: (input: { bibleAbbreviation: string; code: string }) =>
      deleteBookmark({ data: input }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  return (
    <>
      <div className='flex h-full w-full flex-col items-center p-5'>
        <div className='flex w-full max-w-lg flex-col items-center gap-2'>
          <H2 className='inline-block w-fit bg-linear-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
            Your Bookmarks
          </H2>
          <div className='relative w-full'>
            <Search className='-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground' />
            <Input
              type='text'
              placeholder='Search bookmarks'
              className='pr-8 pl-9'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button
                variant='ghost'
                size='icon'
                className='-translate-y-1/2 absolute top-1/2 right-1 size-6 p-0.5'
                onClick={() => setSearch('')}
              >
                <X className='size-4' />
              </Button>
            )}
          </div>
        </div>
        <div className='mt-5 grid w-full max-w-lg grid-cols-1 gap-3 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3'>
          <QueryBoundary
            query={bookmarksQuery}
            render={({ pages }) => {
              const bookmarks = pages.flatMap((page) => page.bookmarks);

              if (bookmarks.length === 0) {
                return (
                  <div className='flex h-full w-full flex-col items-center justify-center p-5 transition-all lg:col-span-3'>
                    <H6 className='text-center'>
                      No bookmarks yet, get{' '}
                      <Link to='/bible' className='hover:underline'>
                        reading
                      </Link>
                      !
                    </H6>
                  </div>
                );
              }

              return bookmarks.map((bookmark) => {
                const contentText = contentsToText(bookmark.chapter.content);
                return (
                  <Card
                    key={`${bookmark.bibleAbbreviation}-${bookmark.chapterCode}-${bookmark.userId}`}
                    className='flex h-full w-full flex-col transition-all'
                  >
                    <CardHeader>
                      <CardTitle>
                        {getHighlightedContent(
                          `${bookmark.chapter.name} (${bookmark.bible.abbreviation})`,
                          search,
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='flex grow flex-col'>
                      {search && contentText.toLowerCase().includes(search.toLowerCase()) && (
                        <P>{getHighlightedContent(contentText, search, 75)}</P>
                      )}
                    </CardContent>
                    <CardFooter className='flex items-end justify-end gap-2'>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant='outline'>Delete</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Are you sure you want to delete this bookmark?
                            </DialogTitle>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant='destructive'
                              onClick={() => {
                                deleteBookmarkMutation.mutate({
                                  bibleAbbreviation: bookmark.bible.abbreviation,
                                  code: bookmark.chapter.code,
                                });
                              }}
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Link
                        to='/bible/$bibleAbbreviation/$bookCode/$chapterNumber'
                        params={{
                          bibleAbbreviation: bookmark.bible.abbreviation,
                          bookCode: bookmark.book.code,
                          chapterNumber: bookmark.chapter.number,
                        }}
                      >
                        <Button>View</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              });
            }}
          />
          <div className='flex w-full justify-center lg:col-span-3'>
            {bookmarksQuery.isFetchingNextPage ? (
              <Spinner size='sm' />
            ) : bookmarksQuery.hasNextPage ? (
              <Button
                onClick={() => {
                  void bookmarksQuery.fetchNextPage();
                }}
              >
                Load more
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
