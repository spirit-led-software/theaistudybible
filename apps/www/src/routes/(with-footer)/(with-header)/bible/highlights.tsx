import { db } from '@/core/database';
import { verseHighlights } from '@/core/database/schema';
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
import { For, Match, Switch, createEffect } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';

const getHighlights = GET(async ({ limit, offset }: { limit: number; offset: number }) => {
  'use server';
  const { user } = auth();
  if (!user) {
    return { highlights: [], nextCursor: undefined };
  }

  const highlights = await db.query.verseHighlights.findMany({
    where: (verseHighlights, { eq }) => eq(verseHighlights.userId, user.id),
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
  });

  return {
    highlights,
    nextCursor: highlights.length === limit ? offset + limit : undefined,
  };
});

const deleteHighlightAction = action(async (highlightId: string) => {
  'use server';
  const { user } = requireAuth();
  await db
    .delete(verseHighlights)
    .where(and(eq(verseHighlights.userId, user.id), eq(verseHighlights.id, highlightId)));
  return { success: true };
});

const getHighlightsQueryOptions = () => ({
  queryKey: ['highlights'],
  queryFn: ({ pageParam }: { pageParam: number }) => getHighlights({ limit: 9, offset: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getHighlights>>) => lastPage.nextCursor,
  keepPreviousData: true,
});

export const route: RouteDefinition = {
  preload: () => {
    const qc = useQueryClient();
    qc.prefetchInfiniteQuery(getHighlightsQueryOptions());
  },
};

export default function HighlightsPage() {
  const deleteHighlight = useAction(deleteHighlightAction);

  const qc = useQueryClient();

  const [autoAnimateRef] = createAutoAnimate();

  const highlightsQuery = createInfiniteQuery(() => getHighlightsQueryOptions());
  const [highlights, setHighlights] = createStore<
    Awaited<ReturnType<typeof getHighlights>>['highlights']
  >([]);
  createEffect(() => {
    if (highlightsQuery.status === 'success') {
      setHighlights(reconcile(highlightsQuery.data.pages.flatMap((page) => page.highlights)));
    }
  });

  const deleteHighlightMutation = createMutation(() => ({
    mutationFn: (highlightId: string) => deleteHighlight(highlightId),
    onSettled: () => qc.invalidateQueries({ queryKey: ['highlights'] }),
  }));

  return (
    <Protected
      signedOutFallback={
        <Navigate href={`/sign-in?redirectUrl=${encodeURIComponent('/bible/highlights')}`} />
      }
    >
      <MetaTags />
      <div class='flex h-full w-full flex-col items-center p-5'>
        <H2 class='inline-block bg-gradient-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
          Your Highlighted Verses
        </H2>
        <div
          ref={autoAnimateRef}
          class='mt-5 grid max-w-lg grid-cols-1 gap-3 lg:max-w-none lg:grid-cols-3'
        >
          <QueryBoundary query={highlightsQuery}>
            {() => (
              <>
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
                          href={`/bible/${highlight.verse.bible.abbreviation}/${highlight.verse.book.code}/${highlight.verse.chapter.number}/${highlight.verse.number}`}
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
              </>
            )}
          </QueryBoundary>
        </div>
      </div>
    </Protected>
  );
}

const MetaTags = () => {
  const title = 'Bible Highlights | The AI Study Bible - Save & Review Important Verses';
  const description =
    'Access and manage your highlighted Bible verses. Use our AI-powered highlighting system to mark, organize, and revisit meaningful passages from Scripture.';

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
