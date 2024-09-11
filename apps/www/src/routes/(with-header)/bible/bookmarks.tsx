import { db } from '@/core/database';
import { chapterBookmarks, verseBookmarks } from '@/core/database/schema';
import { contentsToText } from '@/core/utils/bible';
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
import type { RouteDefinition } from '@solidjs/router';
import { A } from '@solidjs/router';
import { createInfiniteQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { SignedIn, SignedOut, SignIn } from 'clerk-solidjs';
import { auth } from 'clerk-solidjs/server';
import { and, eq } from 'drizzle-orm';
import { createEffect, For, Match, Show, Switch } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { TransitionGroup } from 'solid-transition-group';

const getBookmarks = async ({ limit, offset }: { limit: number; offset: number }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    return {
      bookmarks: [],
      nextCursor: undefined,
    };
  }
  const [verseBookmarks, chapterBookmarks] = await Promise.all([
    db.query.verseBookmarks.findMany({
      where: (verseBookmarks, { eq }) => eq(verseBookmarks.userId, userId),
      with: {
        verse: {
          with: {
            bible: {
              columns: {
                abbreviation: true,
              },
            },
            book: {
              columns: {
                abbreviation: true,
              },
            },
            chapter: {
              columns: {
                number: true,
              },
            },
          },
        },
      },
      limit,
      offset,
    }),
    db.query.chapterBookmarks.findMany({
      where: (chapterBookmarks, { eq }) => eq(chapterBookmarks.userId, userId),
      with: {
        chapter: {
          columns: {
            content: false,
          },
          with: {
            bible: {
              columns: {
                abbreviation: true,
              },
            },
            book: {
              columns: {
                abbreviation: true,
              },
            },
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
};

const deleteBookmark = async (props: { type: 'verse' | 'chapter'; bookmarkId: string }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  if (props.type === 'verse') {
    await db
      .delete(verseBookmarks)
      .where(and(eq(verseBookmarks.userId, userId), eq(verseBookmarks.id, props.bookmarkId)));
  } else {
    await db
      .delete(chapterBookmarks)
      .where(and(eq(chapterBookmarks.userId, userId), eq(chapterBookmarks.id, props.bookmarkId)));
  }
};

const getBookmarksQueryOptions = () => ({
  queryKey: ['bookmarks'],
  queryFn: ({ pageParam }: { pageParam: number }) => getBookmarks({ limit: 9, offset: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getBookmarks>>) => lastPage.nextCursor,
});

export const route: RouteDefinition = {
  preload: async () => {
    const qc = useQueryClient();
    await qc.prefetchInfiniteQuery(getBookmarksQueryOptions());
  },
};

const BookmarksPage = () => {
  const bookmarksQuery = createInfiniteQuery(() => getBookmarksQueryOptions());

  const deleteBookmarkMutation = createMutation(() => ({
    mutationFn: (props: { type: 'verse' | 'chapter'; bookmarkId: string }) => deleteBookmark(props),
    onSettled: () => bookmarksQuery.refetch(),
  }));

  const [bookmarks, setBookmarks] = createStore(
    bookmarksQuery.data?.pages.flatMap((page) => page.bookmarks) || [],
  );
  createEffect(() => {
    setBookmarks(reconcile(bookmarksQuery.data?.pages.flatMap((page) => page.bookmarks) || []));
  });

  return (
    <div class="flex h-full w-full flex-col items-center p-5">
      <SignedIn>
        <H2 class="from-accent-foreground to-primary dark:from-accent-foreground dark:to-secondary-foreground inline-block bg-gradient-to-r bg-clip-text text-transparent">
          Your Bookmarks
        </H2>
        <div class="mt-5 grid w-full max-w-lg grid-cols-1 gap-3 lg:max-w-none lg:grid-cols-3">
          <QueryBoundary query={bookmarksQuery}>
            {() => (
              <TransitionGroup name="card-item">
                <For
                  each={bookmarks}
                  fallback={
                    <div class="flex h-full w-full flex-col items-center justify-center p-5 transition-all lg:col-span-3">
                      <H6 class="text-center">
                        No bookmarks yet, get{' '}
                        <A href="/bible" class="hover:underline">
                          reading
                        </A>
                        !
                      </H6>
                    </div>
                  }
                >
                  {(bookmark, idx) => (
                    <Card data-index={idx()} class="flex h-full w-full flex-col transition-all">
                      <CardHeader>
                        <CardTitle>
                          {'verse' in bookmark ? bookmark.verse.name : bookmark.chapter.name}
                        </CardTitle>
                      </CardHeader>
                      <Show
                        when={'verse' in bookmark && bookmark.verse}
                        fallback={<CardContent class="flex grow flex-col" />}
                        keyed
                      >
                        {(verse) => (
                          <CardContent class="flex grow flex-col">
                            {contentsToText(verse.content)}
                          </CardContent>
                        )}
                      </Show>
                      <CardFooter class="flex items-end justify-end gap-2">
                        <Dialog>
                          <DialogTrigger as={Button} variant="outline">
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
                                variant="destructive"
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
                              ? `/bible/${bookmark.verse.bible.abbreviation}/${bookmark.verse.book.abbreviation}/${bookmark.verse.chapter.number}/${bookmark.verse.number}`
                              : `/bible/${bookmark.chapter.bible.abbreviation}/${bookmark.chapter.book.abbreviation}/${bookmark.chapter.number}`
                          }
                        >
                          View
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                </For>
                <div class="flex w-full justify-center lg:col-span-3">
                  <Switch>
                    <Match when={bookmarksQuery.isFetchingNextPage}>
                      <Spinner size="sm" />
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
              </TransitionGroup>
            )}
          </QueryBoundary>
        </div>
      </SignedIn>
      <SignedOut>
        <SignIn />
      </SignedOut>
    </div>
  );
};

export default BookmarksPage;