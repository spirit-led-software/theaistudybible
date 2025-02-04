import { db } from '@/core/database';
import { chapterBookmarks } from '@/core/database/schema';
import { ilike } from '@/core/database/utils';
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
import { H2, H6 } from '@/www/components/ui/typography';
import { auth, requireAuth } from '@/www/server/auth';
import { createAutoAnimate } from '@formkit/auto-animate/solid';
import { Meta, Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { A, Navigate, action, useAction } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createInfiniteQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { and, eq, inArray } from 'drizzle-orm';
import { Search, X } from 'lucide-solid';
import { For, Match, Show, Switch, createEffect, createSignal } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';

const getBookmarks = GET(
  async ({ limit, offset, search }: { limit: number; offset: number; search?: string }) => {
    'use server';
    const { user } = auth();
    if (!user) {
      return { bookmarks: [], nextCursor: undefined };
    }

    let chapters: { code: string }[] = [];
    if (search) {
      chapters = await db.query.verses.findMany({
        columns: { code: true },
        where: (verses, { or }) =>
          or(ilike(verses.name, `%${search}%`), ilike(verses.content, `%${search}%`)),
      });
    }

    const bookmarks = await db.query.chapterBookmarks.findMany({
      where: (chapterBookmarks, { and, eq }) => {
        const conditions = [eq(chapterBookmarks.userId, user.id)];
        if (chapters.length > 0) {
          conditions.push(
            inArray(
              chapterBookmarks.chapterCode,
              chapters.map((c) => c.code),
            ),
          );
        }
        return and(...conditions);
      },
      with: {
        chapter: {
          columns: { content: false },
          with: {
            bible: { columns: { abbreviation: true } },
            book: { columns: { code: true } },
          },
        },
      },
      limit,
      offset,
    });

    return {
      bookmarks,
      nextCursor: offset + bookmarks.length === limit ? offset + limit : undefined,
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
  keepPreviousData: true,
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

  const bookmarksQuery = createInfiniteQuery(() => getBookmarksQueryOptions({ search: search() }));
  const [bookmarks, setBookmarks] = createStore<
    Awaited<ReturnType<typeof getBookmarks>>['bookmarks']
  >([]);
  createEffect(() => {
    if (bookmarksQuery.status === 'success') {
      setBookmarks(reconcile(bookmarksQuery.data.pages.flatMap((page) => page.bookmarks)));
    }
  });

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
        <div class='flex flex-col gap-2'>
          <H2 class='inline-block bg-linear-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
            Your Bookmarks
          </H2>
          <div class='relative'>
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
            {() => (
              <>
                <For
                  each={bookmarks}
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
                  {(bookmark, idx) => (
                    <Card data-index={idx()} class='flex h-full w-full flex-col transition-all'>
                      <CardHeader>
                        <CardTitle>
                          {getHighlightedVerseContent(bookmark.chapter.name, search())}
                        </CardTitle>
                      </CardHeader>
                      <CardContent class='flex grow flex-col' />
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
                                    bibleAbbreviation: bookmark.chapter.bible.abbreviation,
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
                          href={`/bible/${bookmark.chapter.bible.abbreviation}/${bookmark.chapter.book.code}/${bookmark.chapter.number}`}
                        >
                          View
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                </For>
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
              </>
            )}
          </QueryBoundary>
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

const getHighlightedVerseContent = (content: string, query: string) => {
  if (!query || !content.toLowerCase().includes(query.toLowerCase())) {
    return content;
  }

  return content
    .split(new RegExp(`(${query.toLowerCase()})`, 'gi'))
    .map((part) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span class='inline bg-yellow-200/50 dark:bg-yellow-500/30'>{part}</span>
      ) : (
        part
      ),
    );
};
