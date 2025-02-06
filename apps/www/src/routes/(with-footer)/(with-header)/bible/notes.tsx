import { db } from '@/core/database';
import { ilike } from '@/core/database/utils';
import { Protected } from '@/www/components/auth/control';
import { NoteItemCard } from '@/www/components/bible/reader/activity-panel/notes/note-item-card';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Spinner } from '@/www/components/ui/spinner';
import { TextField, TextFieldInput } from '@/www/components/ui/text-field';
import { H2, H6 } from '@/www/components/ui/typography';
import { auth } from '@/www/server/auth';
import { Meta, Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { A } from '@solidjs/router';
import { Navigate } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createInfiniteQuery, useQueryClient } from '@tanstack/solid-query';
import { count } from 'drizzle-orm';
import { Search, X } from 'lucide-solid';
import { For, Match, Show, Switch, createSignal } from 'solid-js';
import {} from 'solid-js/store';

const getNotes = GET(
  async ({ limit, offset, search }: { limit: number; offset: number; search?: string }) => {
    'use server';
    const { user } = auth();
    if (!user) {
      return { notes: [], nextCursor: null };
    }

    // First get total counts to help with pagination
    const [verseCountResult, chapterCountResult] = await Promise.all([
      db.query.verseNotes.findMany({
        columns: {},
        where: (verseNotes, { and, eq }) => {
          const conditions = [eq(verseNotes.userId, user.id)];
          if (search) {
            conditions.push(ilike(verseNotes.content, `%${search}%`));
          }
          return and(...conditions);
        },
        extras: { count: count().as('count') },
      }),
      db.query.chapterNotes.findMany({
        columns: {},
        where: (chapterNotes, { and, eq }) => {
          const conditions = [eq(chapterNotes.userId, user.id)];
          if (search) {
            conditions.push(ilike(chapterNotes.content, `%${search}%`));
          }
          return and(...conditions);
        },
        extras: { count: count().as('count') },
      }),
    ]);

    const verseCount = verseCountResult[0].count;
    const chapterCount = chapterCountResult[0].count;

    // Calculate proper offset and limit for each query
    const verseOffset = offset > verseCount ? 0 : offset;
    const verseLimit = Math.min(limit, Math.max(0, verseCount - verseOffset));

    const chapterOffset = Math.max(0, offset - verseCount);
    const chapterLimit = Math.min(limit - verseLimit, Math.max(0, chapterCount - chapterOffset));

    const [verseNotes, chapterNotes] = await Promise.all([
      verseLimit > 0
        ? db.query.verseNotes.findMany({
            where: (verseNotes, { and, eq }) => {
              const conditions = [eq(verseNotes.userId, user.id)];
              if (search) {
                conditions.push(ilike(verseNotes.content, `%${search}%`));
              }
              return and(...conditions);
            },
            with: {
              verse: {
                columns: { content: false },
                with: {
                  chapter: { columns: { content: false } },
                  bible: true,
                  book: true,
                },
              },
            },
            limit: verseLimit,
            offset: verseOffset,
          })
        : Promise.resolve([]),
      chapterLimit > 0
        ? db.query.chapterNotes.findMany({
            where: (chapterNotes, { and, eq }) => {
              const conditions = [eq(chapterNotes.userId, user.id)];
              if (search) {
                conditions.push(ilike(chapterNotes.content, `%${search}%`));
              }
              return and(...conditions);
            },
            with: {
              chapter: {
                columns: { content: false },
                with: { bible: true, book: true },
              },
            },
            limit: chapterLimit,
            offset: chapterOffset,
          })
        : Promise.resolve([]),
    ]);

    const notes = [...verseNotes, ...chapterNotes];

    return {
      notes,
      nextCursor: notes.length === limit ? offset + limit : null,
    };
  },
);

const getNotesQueryOptions = (input: { search?: string } = {}) => ({
  queryKey: ['notes', input],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getNotes({ limit: 9, offset: pageParam, search: input.search }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getNotes>>) => lastPage.nextCursor,
});

export const route: RouteDefinition = {
  preload: () => {
    const qc = useQueryClient();
    qc.prefetchInfiniteQuery(getNotesQueryOptions());
  },
};

export default function NotesPage() {
  const [search, setSearch] = createSignal('');

  const notesQuery = createInfiniteQuery(() => ({
    ...getNotesQueryOptions({ search: search() }),
    placeholderData: (prev) => prev,
  }));

  return (
    <Protected
      signedOutFallback={
        <Navigate href={`/sign-in?redirectUrl=${encodeURIComponent('/bible/notes')}`} />
      }
    >
      <MetaTags />
      <div class='flex h-full w-full flex-col items-center p-5'>
        <div class='flex w-full max-w-lg flex-col items-center gap-2'>
          <H2 class='inline-block w-fit bg-linear-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
            Your Notes
          </H2>
          <div class='relative w-full'>
            <Search class='-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground' />
            <TextField value={search()} onChange={setSearch}>
              <TextFieldInput type='text' placeholder='Search notes' class='pr-8 pl-9' />
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
        <div class='mt-5 grid w-full max-w-lg grid-cols-1 gap-3 lg:max-w-none lg:grid-cols-3'>
          <QueryBoundary query={notesQuery}>
            {({ pages }) => (
              <For
                each={pages.flatMap((page) => page.notes)}
                fallback={
                  <div class='flex h-full w-full flex-col items-center justify-center p-5 transition-all lg:col-span-3'>
                    <H6 class='text-center'>
                      No notes yet, get{' '}
                      <A href='/bible' class='hover:underline'>
                        reading
                      </A>
                      !
                    </H6>
                  </div>
                }
              >
                {(note, idx) => (
                  <NoteItemCard
                    data-index={idx()}
                    note={note}
                    bible={'verse' in note ? note.verse.bible : note.chapter.bible}
                    book={'verse' in note ? note.verse.book : note.chapter.book}
                    chapter={'verse' in note ? note.verse.chapter : note.chapter}
                    verse={'verse' in note ? note.verse : undefined}
                    showViewButton
                  />
                )}
              </For>
            )}
          </QueryBoundary>
          <div class='flex w-full justify-center lg:col-span-3'>
            <Switch>
              <Match when={notesQuery.isFetchingNextPage}>
                <Spinner size='sm' />
              </Match>
              <Match when={notesQuery.hasNextPage}>
                <Button
                  onClick={() => {
                    void notesQuery.fetchNextPage();
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
  const title = 'Bible Notes & Annotations | The AI Study Bible - Your Personal Bible Study Notes';
  const description =
    'Access and manage your personal Bible study notes, annotations, and insights. Create, view, and organize your Bible study notes with The AI Study Bible.';

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
