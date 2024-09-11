import { db } from '@/core/database';
import { verseHighlights } from '@/core/database/schema';
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
import { createEffect, For, Match, Switch } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { TransitionGroup } from 'solid-transition-group';

const getHighlights = async ({ limit, offset }: { limit: number; offset: number }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    return {
      highlights: [],
      nextCursor: undefined,
    };
  }
  const highlights = await db.query.verseHighlights.findMany({
    where: (verseHighlights, { eq }) => eq(verseHighlights.userId, userId),
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
  });

  return {
    highlights,
    nextCursor: highlights.length === limit ? offset + limit : undefined,
  };
};

const deleteHighlight = async (highlightId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  await db
    .delete(verseHighlights)
    .where(and(eq(verseHighlights.userId, userId), eq(verseHighlights.id, highlightId)));
};

const getHighlightsQueryOptions = () => ({
  queryKey: ['highlights'],
  queryFn: ({ pageParam }: { pageParam: number }) => getHighlights({ limit: 9, offset: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getHighlights>>) => lastPage.nextCursor,
});

export const route: RouteDefinition = {
  preload: async () => {
    const qc = useQueryClient();
    await qc.prefetchInfiniteQuery(getHighlightsQueryOptions());
  },
};

const HighlightsPage = () => {
  const highlightsQuery = createInfiniteQuery(() => getHighlightsQueryOptions());

  const deleteHighlightMutation = createMutation(() => ({
    mutationFn: (highlightId: string) => deleteHighlight(highlightId),
    onSettled: () => highlightsQuery.refetch(),
  }));

  const [highlights, setHighlights] = createStore(
    highlightsQuery.data?.pages.flatMap((page) => page.highlights) ?? [],
  );
  createEffect(() => {
    setHighlights(
      reconcile(highlightsQuery.data?.pages.flatMap((page) => page.highlights) ?? [], {
        merge: true,
      }),
    );
  });

  return (
    <div class='flex h-full w-full flex-col items-center p-5'>
      <SignedIn>
        <H2 class='from-accent-foreground to-primary dark:from-accent-foreground dark:to-secondary-foreground inline-block bg-gradient-to-r bg-clip-text text-transparent'>
          Your Highlighted Verses
        </H2>
        <div class='mt-5 grid max-w-lg grid-cols-1 gap-3 lg:max-w-none lg:grid-cols-3'>
          <QueryBoundary query={highlightsQuery}>
            {() => (
              <TransitionGroup name='card-item'>
                <For
                  each={highlights}
                  fallback={
                    <div class='flex h-full w-full flex-col items-center justify-center p-5 transition-all lg:col-span-3'>
                      <H6 class='text-center'>
                        No highlights yet, get{' '}
                        <A href='/bible' class='hover:underline'>
                          reading
                        </A>
                        !
                      </H6>
                    </div>
                  }
                >
                  {(highlight, idx) => (
                    <Card data-index={idx()} class='flex h-full w-full flex-col transition-all'>
                      <CardHeader class='flex flex-row items-center justify-between'>
                        <CardTitle>{highlight.verse.name}</CardTitle>
                        <div
                          class='size-6 rounded-full'
                          style={{
                            'background-color': highlight.color,
                          }}
                        />
                      </CardHeader>
                      <CardContent class='flex grow flex-col'>
                        {contentsToText(highlight.verse.content)}
                      </CardContent>
                      <CardFooter class='flex justify-end gap-2'>
                        <Dialog>
                          <DialogTrigger as={Button} variant='outline'>
                            Delete
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
                                  deleteHighlightMutation.mutate(highlight.id);
                                }}
                              >
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          as={A}
                          href={`/bible/${highlight.verse.bible.abbreviation}/${highlight.verse.book.abbreviation}/${highlight.verse.chapter.number}/${highlight.verse.number}`}
                        >
                          View
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                </For>
                <div class='flex w-full justify-center lg:col-span-3'>
                  <Switch>
                    <Match when={highlightsQuery.isFetchingNextPage}>
                      <Spinner size='sm' />
                    </Match>
                    <Match when={highlightsQuery.hasNextPage}>
                      <Button
                        onClick={() => {
                          void highlightsQuery.fetchNextPage();
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

export default HighlightsPage;
