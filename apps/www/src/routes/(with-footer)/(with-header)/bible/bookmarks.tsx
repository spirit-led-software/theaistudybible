import { db } from '@/core/database';
import {
  bibles as biblesTable,
  books as booksTable,
  chapterBookmarks,
  chapters as chaptersTable,
} from '@/core/database/schema';
import { ilike } from '@/core/database/utils';
import { contentsToText } from '@/core/utils/bibles/contents-to-text';
import { Protected } from '@/www/components/auth/control';
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
import { Spinner } from '@/www/components/ui/spinner';
import { TextField, TextFieldInput } from '@/www/components/ui/text-field';
import { H2, H6, P } from '@/www/components/ui/typography';
import { auth, requireAuth } from '@/www/server/auth';
import { getHighlightedContent } from '@/www/utils/get-highlighted-content';
import { createAutoAnimate } from '@formkit/auto-animate/solid';
import { Meta, Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { A, Navigate, action, useAction } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createInfiniteQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { type SQL, and, desc, eq, getTableColumns, or } from 'drizzle-orm';
import { Search, X } from 'lucide-solid';
import { For, Match, Show, Switch, createSignal } from 'solid-js';

const getBookmarks = GET(
  async ({ limit, offset, search }: { limit: number; offset: number; search?: string }) => {
    'use server';
    const { user } = auth();
    if (!user) {
      return { bookmarks: [], nextCursor: null };
    }

    let joinCondition: SQL | undefined = and(
      eq(chapterBookmarks.bibleAbbreviation, chaptersTable.bibleAbbreviation),
      eq(chapterBookmarks.chapterCode, chaptersTable.code),
    );
    if (search) {
      joinCondition = and(
        joinCondition,
        or(
          ilike(chaptersTable.bibleAbbreviation, `%${search}%`),
          ilike(chaptersTable.name, `%${search}%`),
          ilike(chaptersTable.content, `%${search}%`),
        ),
      );
    }

    const bookmarks = await db
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
      .offset(offset);

    return {
      bookmarks,
      nextCursor: bookmarks.length === limit ? offset + limit : null,
    };
  },
);

const deleteBookmarkAction = action(async (props: { bibleAbbreviation: string; code: string }) => {
  'use server';
  const { user } = requireAuth();
  await db
    .delete(chapterBookmarks)
    .where(
      and(
        eq(chapterBookmarks.userId, user.id),
        eq(chapterBookmarks.bibleAbbreviation, props.bibleAbbreviation),
        eq(chapterBookmarks.chapterCode, props.code),
      ),
    );
  return { success: true };
});

const getBookmarksQueryOptions = (input: { search?: string } = {}) => ({
  queryKey: ['bookmarks', input],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getBookmarks({ limit: 9, offset: pageParam, search: input.search }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getBookmarks>>) => lastPage.nextCursor,
});

export const route: RouteDefinition = {
  preload: () => {
    const qc = useQueryClient();
    qc.prefetchInfiniteQuery(getBookmarksQueryOptions());
  },
};

export default function BookmarksPage() {
  const deleteBookmark = useAction(deleteBookmarkAction);
  const qc = useQueryClient();
  const [autoAnimateRef] = createAutoAnimate();
  const [search, setSearch] = createSignal('');

  const bookmarksQuery = createInfiniteQuery(() => ({
    ...getBookmarksQueryOptions({ search: search() }),
    placeholderData: (prev) => prev,
  }));

  const deleteBookmarkMutation = createMutation(() => ({
    mutationFn: (props: { bibleAbbreviation: string; code: string }) => deleteBookmark(props),
    onSettled: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
  }));

  return (
    <Protected
      signedOutFallback={
        <Navigate href={`/sign-in?redirectUrl=${encodeURIComponent('/bible/bookmarks')}`} />
      }
    >
      <MetaTags />
      <div class='flex h-full w-full flex-col items-center p-5'>
        <div class='flex w-full max-w-lg flex-col items-center gap-2'>
          <H2 class='inline-block w-fit bg-linear-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
            Your Bookmarks
          </H2>
          <div class='relative w-full'>
            <Search class='-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground' />
            <TextField value={search()} onChange={setSearch}>
              <TextFieldInput type='text' placeholder='Search bookmarks' class='pr-8 pl-9' />
            </TextField>
            <Show when={search()}>
              <Button
                variant='ghost'
                size='icon'
                class='-translate-y-1/2 absolute top-1/2 right-1 size-6 p-0.5'
                onClick={() => setSearch('')}
              >
                <X class='size-4' />
              </Button>
            </Show>
          </div>
        </div>
        <div
          ref={autoAnimateRef}
          class='mt-5 grid w-full max-w-lg grid-cols-1 gap-3 lg:max-w-none lg:grid-cols-3'
        >
          <QueryBoundary query={bookmarksQuery}>
            {({ pages }) => (
              <For
                each={pages.flatMap((page) => page.bookmarks)}
                fallback={
                  <div class='flex h-full w-full flex-col items-center justify-center p-5 transition-all lg:col-span-3'>
                    <H6 class='text-center'>
                      No bookmarks yet, get{' '}
                      <A href='/bible' class='hover:underline'>
                        reading
                      </A>
                      !
                    </H6>
                  </div>
                }
              >
                {(bookmark, idx) => {
                  const contentText = contentsToText(bookmark.chapter.content);
                  return (
                    <Card data-index={idx()} class='flex h-full w-full flex-col transition-all'>
                      <CardHeader>
                        <CardTitle>
                          {getHighlightedContent(
                            `${bookmark.chapter.name} (${bookmark.bible.abbreviation})`,
                            search(),
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent class='flex grow flex-col'>
                        <Show
                          when={
                            search() && contentText.toLowerCase().includes(search().toLowerCase())
                          }
                        >
                          <P>{getHighlightedContent(contentText, search(), 75)}</P>
                        </Show>
                      </CardContent>
                      <CardFooter class='flex items-end justify-end gap-2'>
                        <Dialog>
                          <DialogTrigger as={Button} variant='outline'>
                            Delete
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
                        <Button
                          as={A}
                          href={`/bible/${bookmark.bible.abbreviation}/${bookmark.book.code}/${bookmark.chapter.number}`}
                        >
                          View
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                }}
              </For>
            )}
          </QueryBoundary>
          <div class='flex w-full justify-center lg:col-span-3'>
            <Switch>
              <Match when={bookmarksQuery.isFetchingNextPage}>
                <Spinner size='sm' />
              </Match>
              <Match when={bookmarksQuery.hasNextPage}>
                <Button
                  onClick={() => {
                    void bookmarksQuery.fetchNextPage();
                  }}
                >
                  Load more
                </Button>
              </Match>
            </Switch>
          </div>
        </div>
      </div>
    </Protected>
  );
}

const MetaTags = () => {
  const title = 'Bible Bookmarks | The AI Study Bible - Save Your Reading Progress';
  const description =
    'Access your saved Bible bookmarks. Keep track of chapters and verses for easy reference and continue your Bible study journey where you left off.';

  return (
    <>
      <Title>{title}</Title>
      <Meta name='description' content={description} />
      <Meta property='og:title' content={title} />
      <Meta property='og:description' content={description} />
      <Meta name='twitter:card' content='summary' />
      <Meta name='twitter:title' content={title} />
      <Meta name='twitter:description' content={description} />
    </>
  );
};
