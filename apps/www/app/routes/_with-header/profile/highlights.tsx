import { db } from '@/core/database';
import {
  bibles as biblesTable,
  books as booksTable,
  chapters as chaptersTable,
  verseHighlights,
  verses as versesTable,
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
import { and, desc, eq, or } from 'drizzle-orm';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

export const Route = createFileRoute('/_with-header/profile/highlights')({
  head: () => {
    const title = 'Bible Highlights | The AI Study Bible - Save & Review Important Verses';
    const description =
      'Access and manage your highlighted Bible verses. Use our AI-powered highlighting system to mark, organize, and revisit meaningful passages from Scripture.';

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

const getHighlights = createServerFn({ method: 'GET' })
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
      return { highlights: [], nextCursor: null };
    }

    const joinCondition = and(
      eq(verseHighlights.verseCode, versesTable.code),
      eq(verseHighlights.bibleAbbreviation, versesTable.bibleAbbreviation),
    );

    const query = db
      .select({
        bibleAbbreviation: verseHighlights.bibleAbbreviation,
        verseCode: verseHighlights.verseCode,
        color: verseHighlights.color,
        createdAt: verseHighlights.createdAt,
        updatedAt: verseHighlights.updatedAt,
        userId: verseHighlights.userId,
        bible: { abbreviation: biblesTable.abbreviation },
        book: { code: booksTable.code },
        chapter: { code: chaptersTable.code, number: chaptersTable.number },
        verse: {
          code: versesTable.code,
          name: versesTable.name,
          number: versesTable.number,
          content: versesTable.content,
        },
      })
      .from(verseHighlights)
      .where(eq(verseHighlights.userId, user.id))
      .innerJoin(versesTable, joinCondition)
      .innerJoin(biblesTable, eq(versesTable.bibleAbbreviation, biblesTable.abbreviation))
      .innerJoin(
        booksTable,
        and(
          eq(versesTable.bookCode, booksTable.code),
          eq(versesTable.bibleAbbreviation, booksTable.bibleAbbreviation),
        ),
      )
      .innerJoin(
        chaptersTable,
        and(
          eq(versesTable.chapterCode, chaptersTable.code),
          eq(versesTable.bibleAbbreviation, chaptersTable.bibleAbbreviation),
        ),
      )
      .orderBy(desc(verseHighlights.createdAt))
      .limit(limit)
      .offset(offset)
      .$dynamic();

    if (search) {
      query.where(
        or(
          ilike(versesTable.bibleAbbreviation, `%${search}%`),
          ilike(versesTable.name, `%${search}%`),
          ilike(versesTable.content, `%${search}%`),
        ),
      );
    }

    const highlights = await query.execute();

    return {
      highlights,
      nextCursor: highlights.length === limit ? offset + limit : null,
    };
  });

const deleteHighlight = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(
    z.object({
      bibleAbbreviation: z.string(),
      verseCode: z.string(),
    }),
  )
  .handler(async ({ data: { bibleAbbreviation, verseCode }, context }) => {
    'use server';
    const { user } = context;
    if (!user) {
      throw new Error('Not authenticated');
    }

    await db
      .delete(verseHighlights)
      .where(
        and(
          eq(verseHighlights.userId, user.id),
          eq(verseHighlights.bibleAbbreviation, bibleAbbreviation),
          eq(verseHighlights.verseCode, verseCode),
        ),
      );
    return { success: true };
  });

const getHighlightsQueryOptions = (input: { search?: string } = {}) => ({
  queryKey: ['highlights', input],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getHighlights({ data: { limit: 9, offset: pageParam, search: input.search } }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: { nextCursor: number | null }) => lastPage.nextCursor,
});

function RouteComponent() {
  const [search, setSearch] = useState('');

  const highlightsQuery = useInfiniteQuery({
    ...getHighlightsQueryOptions({ search }),
    placeholderData: (prev) => prev,
  });

  const qc = useQueryClient();
  const deleteHighlightMutation = useMutation({
    mutationFn: (input: { bibleAbbreviation: string; verseCode: string }) =>
      deleteHighlight({ data: input }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['highlights'] }),
  });

  return (
    <>
      <div className='flex h-full w-full flex-col items-center p-5'>
        <div className='flex w-full max-w-lg flex-col items-center gap-2'>
          <H2 className='inline-block w-fit bg-linear-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
            Your Highlights
          </H2>
          <div className='relative w-full'>
            <Search className='-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground' />
            <Input
              className='pr-8 pl-9'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search highlights'
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
            query={highlightsQuery}
            render={({ pages }) => {
              const highlights = pages.flatMap((page) => page.highlights);

              if (highlights.length === 0) {
                return (
                  <div className='flex h-full w-full flex-col items-center justify-center p-5 transition-all lg:col-span-3'>
                    <H6 className='text-center'>
                      No highlights yet, get{' '}
                      <Link to='/bible' className='hover:underline'>
                        reading
                      </Link>
                      !
                    </H6>
                  </div>
                );
              }

              return highlights.map((highlight) => {
                const contentText = contentsToText(highlight.verse.content);
                return (
                  <Card
                    key={`${highlight.bibleAbbreviation}-${highlight.verseCode}-${highlight.userId}`}
                    className='flex h-full w-full flex-col transition-all'
                  >
                    <CardHeader className='flex flex-row items-center justify-between'>
                      <CardTitle>
                        {getHighlightedContent(
                          `${highlight.verse.name} (${highlight.bible.abbreviation})`,
                          search,
                        )}
                      </CardTitle>
                      <div
                        className='size-6 rounded-full'
                        style={{ backgroundColor: highlight.color }}
                      />
                    </CardHeader>
                    <CardContent className='flex grow flex-col'>
                      {search && contentText.toLowerCase().includes(search.toLowerCase()) && (
                        <P>{getHighlightedContent(contentText, search, 75)}</P>
                      )}
                    </CardContent>
                    <CardFooter className='flex justify-end gap-2'>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant='outline'>Delete</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Are you sure you want to delete this highlight?
                            </DialogTitle>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant='destructive'
                              onClick={() => {
                                deleteHighlightMutation.mutate({
                                  bibleAbbreviation: highlight.bible.abbreviation,
                                  verseCode: highlight.verse.code,
                                });
                              }}
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Link
                        to='/bible/$bibleAbbreviation/$bookCode/$chapterNumber/$verseNumber'
                        params={{
                          bibleAbbreviation: highlight.bible.abbreviation,
                          bookCode: highlight.book.code,
                          chapterNumber: highlight.chapter.number,
                          verseNumber: highlight.verse.number,
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
            {highlightsQuery.isFetchingNextPage ? (
              <Spinner size='sm' />
            ) : highlightsQuery.hasNextPage ? (
              <Button
                onClick={() => {
                  void highlightsQuery.fetchNextPage();
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
