import { A, RouteDefinition } from '@solidjs/router';
import { createInfiniteQuery, useQueryClient } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { contentsToText } from '@theaistudybible/core/util/bible';
import { For, Match, Switch, createEffect } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { SignIn, SignedIn, SignedOut } from '~/components/clerk';
import { QueryBoundary } from '~/components/query-boundary';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Spinner } from '~/components/ui/spinner';
import { H2, H6 } from '~/components/ui/typography';
import { auth } from '~/lib/server/clerk';

const getBookmarks = async ({ limit, offset }: { limit: number; offset: number }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    return {
      bookmarks: [],
      nextCursor: undefined
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
                abbreviation: true
              }
            },
            book: {
              columns: {
                abbreviation: true
              }
            },
            chapter: {
              columns: {
                number: true
              }
            }
          }
        }
      },
      limit,
      offset
    }),
    db.query.chapterBookmarks.findMany({
      where: (chapterBookmarks, { eq }) => eq(chapterBookmarks.userId, userId),
      with: {
        chapter: {
          columns: {
            content: false
          },
          with: {
            bible: {
              columns: {
                abbreviation: true
              }
            },
            book: {
              columns: {
                abbreviation: true
              }
            }
          }
        }
      },
      limit,
      offset
    })
  ]);

  const bookmarks = [...verseBookmarks, ...chapterBookmarks];

  return {
    bookmarks,
    nextCursor: bookmarks.length === limit ? offset + limit : undefined
  };
};

const getBookmarksQueryOptions = () => ({
  queryKey: ['bookmarks'],
  queryFn: ({ pageParam }: { pageParam: number }) => getBookmarks({ limit: 9, offset: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getBookmarks>>) => lastPage.nextCursor
});

export const route: RouteDefinition = {
  load: () => {
    const qc = useQueryClient();
    qc.prefetchInfiniteQuery(getBookmarksQueryOptions());
  }
};

const BookmarksPage = () => {
  const query = createInfiniteQuery(() => getBookmarksQueryOptions());

  const [bookmarks, setBookmarks] = createStore(
    query.data?.pages.flatMap((page) => page.bookmarks) || []
  );
  createEffect(() => {
    setBookmarks(reconcile(query.data?.pages.flatMap((page) => page.bookmarks) || []));
  });

  return (
    <div class="flex h-full w-full flex-col items-center justify-center p-5">
      <SignedIn>
        <H2 class="inline-block bg-gradient-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
          Your Bookmarks
        </H2>
        <QueryBoundary query={query}>
          {() => (
            <div class="mt-5 grid w-full max-w-lg grid-cols-1 gap-3 lg:max-w-none lg:grid-cols-3">
              <For
                each={bookmarks}
                fallback={
                  <div class="flex h-full w-full flex-col items-center justify-center p-5">
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
                {(bookmark) => (
                  <Switch>
                    <Match when={'verse' in bookmark && bookmark.verse} keyed>
                      {(verse) => (
                        <A
                          href={`/bible/${verse.bible.abbreviation}/${verse.book.abbreviation}/${verse.chapter.number}/${verse.number}`}
                        >
                          <Card class="h-full w-full">
                            <CardHeader>
                              <CardTitle class="text-center">{verse.name}</CardTitle>
                            </CardHeader>
                            <CardContent>{contentsToText(verse.content)}</CardContent>
                          </Card>
                        </A>
                      )}
                    </Match>
                    <Match when={'chapter' in bookmark && bookmark.chapter} keyed>
                      {(chapter) => (
                        <A
                          href={`/bible/${chapter.bible.abbreviation}/${chapter.book.abbreviation}/${chapter.number}`}
                        >
                          <Card class="h-full w-full">
                            <CardHeader>
                              <CardTitle class="text-center">{chapter.name}</CardTitle>
                            </CardHeader>
                            <CardContent>Click to view</CardContent>
                          </Card>
                        </A>
                      )}
                    </Match>
                  </Switch>
                )}
              </For>
              <div class="flex w-full justify-center lg:col-span-3">
                <Switch>
                  <Match when={query.isFetchingNextPage}>
                    <Spinner size="sm" />
                  </Match>
                  <Match when={query.hasNextPage}>
                    <Button
                      onClick={() => {
                        query.fetchNextPage();
                      }}
                    >
                      Load more
                    </Button>
                  </Match>
                </Switch>
              </div>
            </div>
          )}
        </QueryBoundary>
      </SignedIn>
      <SignedOut>
        <SignIn />
      </SignedOut>
    </div>
  );
};

export default BookmarksPage;
