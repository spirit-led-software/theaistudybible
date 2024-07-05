import { A, RouteDefinition } from '@solidjs/router';
import { createInfiniteQuery, useQueryClient } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { contentsToText } from '@theaistudybible/core/util/bible';
import { createEffect, For, Match, Switch } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { SignedIn, SignedOut, SignIn } from '~/components/clerk';
import { QueryBoundary } from '~/components/query-boundary';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Spinner } from '~/components/ui/spinner';
import { H2, H6 } from '~/components/ui/typography';
import { auth } from '~/lib/server/clerk';

const getHighlights = async ({ limit, offset }: { limit: number; offset: number }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    return {
      highlights: [],
      nextCursor: undefined
    };
  }
  const highlights = await db.query.verseHighlights.findMany({
    where: (verseHighlights, { eq }) => eq(verseHighlights.userId, userId),
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
  });

  return {
    highlights,
    nextCursor: highlights.length === limit ? offset + limit : undefined
  };
};

const getHighlightsQueryOptions = () => ({
  queryKey: ['highlights'],
  queryFn: ({ pageParam }: { pageParam: number }) => getHighlights({ limit: 9, offset: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getHighlights>>) => lastPage.nextCursor
});

export const route: RouteDefinition = {
  load: () => {
    const qc = useQueryClient();
    qc.prefetchInfiniteQuery(getHighlightsQueryOptions());
  }
};

const HighlightsPage = () => {
  const query = createInfiniteQuery(() => getHighlightsQueryOptions());

  const [highlights, setHighlights] = createStore(
    query.data?.pages.flatMap((page) => page.highlights) || []
  );
  createEffect(() => {
    setHighlights(reconcile(query.data?.pages.flatMap((page) => page.highlights) || []));
  });

  return (
    <div class="flex h-full w-full flex-col items-center justify-center p-5">
      <SignedIn>
        <H2 class="inline-block bg-gradient-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
          Your Highlighted Verses
        </H2>
        <QueryBoundary query={query}>
          {() => (
            <div class="mt-5 grid max-w-lg grid-cols-1 gap-3 lg:max-w-none lg:grid-cols-3">
              <For
                each={highlights}
                fallback={
                  <div class="flex h-full w-full flex-col items-center justify-center p-5">
                    <H6 class="text-center">
                      No highlights yet, get{' '}
                      <A href="/bible" class="hover:underline">
                        reading
                      </A>
                      !
                    </H6>
                  </div>
                }
              >
                {(highlight) => (
                  <A
                    href={`/bible/${highlight.verse.bible.abbreviation}/${highlight.verse.book.abbreviation}/${highlight.verse.chapter.number}/${highlight.verse.number}`}
                  >
                    <Card class="h-full w-full">
                      <CardHeader>
                        <CardTitle class="text-center">{highlight.verse.name}</CardTitle>
                      </CardHeader>
                      <CardContent>{contentsToText(highlight.verse.content)}</CardContent>
                    </Card>
                  </A>
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

export default HighlightsPage;
