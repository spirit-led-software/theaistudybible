import { db } from '@/core/database';
import { chapterBookmarks, verseBookmarks } from '@/core/database/schema';
import { contentsToText } from '@/core/utils/bible';
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
import { H2, H6 } from '@/www/components/ui/typography';
import { auth, requireAuth } from '@/www/server/auth';
import { createAutoAnimate } from '@formkit/auto-animate/solid';
import { Meta, Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { A, Navigate, action, useAction } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createInfiniteQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { and, eq } from 'drizzle-orm';
import { For, Match, Show, Switch, createEffect } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';

const getBookmarks = GET(async ({ limit, offset }: { limit: number; offset: number }) => {
  'use server';
  const { user } = auth();
  if (!user) {
    return { bookmarks: [], nextCursor: undefined };
  }
  const [verseBookmarks, chapterBookmarks] = await Promise.all([
    db.query.verseBookmarks.findMany({
      where: (verseBookmarks, { eq }) => eq(verseBookmarks.userId, user.id),
      with: {
        verse: {
          with: {
            bible: { columns: { abbreviation: true } },
            book: { columns: { code: true } },
            chapter: { columns: { number: true } },
          },
        },
      },
      limit,
      offset,
    }),
    db.query.chapterBookmarks.findMany({
      where: (chapterBookmarks, { eq }) => eq(chapterBookmarks.userId, user.id),
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
    }),
  ]);
  const bookmarks = [...verseBookmarks, ...chapterBookmarks];
  return {
    bookmarks,
    nextCursor: bookmarks.length === limit ? offset + limit : undefined,
  };
});

const deleteBookmarkAction = action(
  async (props: { type: 'verse' | 'chapter'; bookmarkId: string }) => {
    'use server';
    const { user } = requireAuth();
    if (props.type === 'verse') {
      await db
        .delete(verseBookmarks)
        .where(and(eq(verseBookmarks.userId, user.id), eq(verseBookmarks.id, props.bookmarkId)));
    } else {
      await db
        .delete(chapterBookmarks)
        .where(
          and(eq(chapterBookmarks.userId, user.id), eq(chapterBookmarks.id, props.bookmarkId)),
        );
    }
    return { success: true };
  },
);

const getBookmarksQueryOptions = () => ({
  queryKey: ['bookmarks'],
  queryFn: ({ pageParam }: { pageParam: number }) => getBookmarks({ limit: 9, offset: pageParam }),
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

  const bookmarksQuery = createInfiniteQuery(() => getBookmarksQueryOptions());
  const [bookmarks, setBookmarks] = createStore<
    Awaited<ReturnType<typeof getBookmarks>>['bookmarks']
  >([]);
  createEffect(() => {
    if (bookmarksQuery.status === 'success') {
      setBookmarks(reconcile(bookmarksQuery.data.pages.flatMap((page) => page.bookmarks)));
    }
  });

  const deleteBookmarkMutation = createMutation(() => ({
    mutationFn: (props: { type: 'verse' | 'chapter'; bookmarkId: string }) => deleteBookmark(props),
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
        <H2 class='inline-block bg-gradient-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
          Your Bookmarks
        </H2>
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
                          {'verse' in bookmark ? bookmark.verse.name : bookmark.chapter.name}
                        </CardTitle>
                      </CardHeader>
                      <Show
                        when={'verse' in bookmark && bookmark.verse}
                        fallback={<CardContent class='flex grow flex-col' />}
                        keyed
                      >
                        {(verse) => (
                          <CardContent class='flex grow flex-col'>
                            {contentsToText(verse.content)}
                          </CardContent>
                        )}
                      </Show>
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
                                    type: 'verse' in bookmark ? 'verse' : 'chapter',
                                    bookmarkId: bookmark.id,
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
                          href={
                            'verse' in bookmark
                              ? `/bible/${bookmark.verse.bible.abbreviation}/${bookmark.verse.book.code}/${bookmark.verse.chapter.number}/${bookmark.verse.number}`
                              : `/bible/${bookmark.chapter.bible.abbreviation}/${bookmark.chapter.book.code}/${bookmark.chapter.number}`
                          }
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
