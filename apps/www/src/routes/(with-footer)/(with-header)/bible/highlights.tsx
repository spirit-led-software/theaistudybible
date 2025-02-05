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
import {} from 'solid-js/store';

const getHighlights = GET(
  async ({ limit, offset, search }: { limit: number; offset: number; search?: string }) => {
    'use server';
    const { user } = auth();
    if (!user) {
      return { highlights: [], nextCursor: null };
    }

    let joinCondition: SQL | undefined = and(
      eq(verseHighlights.verseCode, versesTable.code),
      eq(verseHighlights.bibleAbbreviation, versesTable.bibleAbbreviation),
    );
    if (search) {
      joinCondition = and(
        joinCondition,
        or(ilike(versesTable.name, `%${search}%`), ilike(versesTable.content, `%${search}%`)),
      );
    }

    const highlights = await db
      .select({
        ...getTableColumns(verseHighlights),
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
      .offset(offset);

    return {
      highlights,
      nextCursor: highlights.length === limit ? offset + limit : null,
    };
  },
);

const deleteHighlightAction = action(
  async (input: { bibleAbbreviation: string; verseCode: string }) => {
    'use server';
    const { user } = requireAuth();
    await db
      .delete(verseHighlights)
      .where(
        and(
          eq(verseHighlights.userId, user.id),
          eq(verseHighlights.bibleAbbreviation, input.bibleAbbreviation),
          eq(verseHighlights.verseCode, input.verseCode),
        ),
      );
    return { success: true };
  },
);

const getHighlightsQueryOptions = (input?: { search?: string }) => ({
  queryKey: ['highlights', input],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getHighlights({ limit: 9, offset: pageParam, search: input?.search }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getHighlights>>) => lastPage.nextCursor,
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

  const [search, setSearch] = createSignal('');

  const highlightsQuery = createInfiniteQuery(() => ({
    ...getHighlightsQueryOptions({ search: search() }),
    placeholderData: (prev) => prev,
  }));

  const deleteHighlightMutation = createMutation(() => ({
    mutationFn: (input: { bibleAbbreviation: string; verseCode: string }) => deleteHighlight(input),
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
        <div class='flex w-full max-w-lg flex-col items-center gap-2'>
          <H2 class='inline-block w-fit bg-linear-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
            Your Highlights
          </H2>
          <div class='relative w-full'>
            <Search class='-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground' />
            <TextField value={search()} onChange={setSearch}>
              <TextFieldInput type='text' placeholder='Search highlights' class='pr-8 pl-9' />
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
          class='mt-5 grid max-w-lg grid-cols-1 gap-3 lg:max-w-none lg:grid-cols-3'
        >
          <QueryBoundary query={highlightsQuery}>
            {({ pages }) => (
              <For
                each={pages.flatMap((page) => page.highlights)}
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
                      <CardTitle>{getHighlightedContent(highlight.verse.name, search())}</CardTitle>
                      <div
                        class='size-6 rounded-full'
                        style={{ 'background-color': highlight.color }}
                      />
                    </CardHeader>
                    <CardContent class='flex grow flex-col'>
                      <p>
                        {getHighlightedContent(
                          contentsToText(highlight.verse.content),
                          search(),
                          50,
                        )}
                      </p>
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
                      <Button
                        as={A}
                        href={`/bible/${highlight.bible.abbreviation}/${highlight.book.code}/${highlight.chapter.number}/${highlight.verse.number}`}
                      >
                        View
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </For>
            )}
          </QueryBoundary>
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
