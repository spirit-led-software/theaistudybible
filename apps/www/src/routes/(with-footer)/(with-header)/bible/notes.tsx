import { db } from '@/core/database';
import { SignedIn, SignedOut } from '@/www/components/auth/control';
import { SignIn } from '@/www/components/auth/sign-in';
import { NoteItemCard } from '@/www/components/bible/reader/activity-panel/notes/note-item-card';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Spinner } from '@/www/components/ui/spinner';
import { H2, H6 } from '@/www/components/ui/typography';
import { auth } from '@/www/server/auth';
import { createAutoAnimate } from '@formkit/auto-animate/solid';
import { Meta, Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { A } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createInfiniteQuery, useQueryClient } from '@tanstack/solid-query';
import { For, Match, Switch, createEffect } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';

const getNotes = GET(async ({ limit, offset }: { limit: number; offset: number }) => {
  'use server';
  const { user } = auth();
  if (!user) {
    return { notes: [], nextCursor: undefined };
  }
  const [verseNotes, chapterNotes] = await Promise.all([
    db.query.verseNotes.findMany({
      where: (verseNotes, { eq }) => eq(verseNotes.userId, user.id),
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
      limit,
      offset,
    }),
    db.query.chapterNotes.findMany({
      where: (chapterNotes, { eq }) => eq(chapterNotes.userId, user.id),
      with: {
        chapter: {
          columns: { content: false },
          with: { bible: true, book: true },
        },
      },
      limit,
      offset,
    }),
  ]);

  const notes = [...verseNotes, ...chapterNotes];

  return {
    notes,
    nextCursor: notes.length === limit ? offset + limit : undefined,
  };
});

const getNotesQueryOptions = () => ({
  queryKey: ['notes'],
  queryFn: ({ pageParam }: { pageParam: number }) => getNotes({ limit: 9, offset: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getNotes>>) => lastPage.nextCursor,
  keepPreviousData: true,
});

export const route: RouteDefinition = {
  preload: () => {
    const qc = useQueryClient();
    qc.prefetchInfiniteQuery(getNotesQueryOptions());
  },
};

export default function NotesPage() {
  const [autoAnimateRef] = createAutoAnimate();

  const notesQuery = createInfiniteQuery(() => getNotesQueryOptions());
  const [notes, setNotes] = createStore<Awaited<ReturnType<typeof getNotes>>['notes']>([]);
  createEffect(() => {
    if (notesQuery.status === 'success') {
      setNotes(reconcile(notesQuery.data.pages.flatMap((page) => page.notes)));
    }
  });

  return (
    <>
      <MetaTags />
      <div class='flex h-full w-full flex-col items-center p-5'>
        <SignedIn>
          <H2 class='inline-block bg-gradient-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
            Your Notes
          </H2>
          <div
            ref={autoAnimateRef}
            class='mt-5 grid w-full max-w-lg grid-cols-1 gap-3 lg:max-w-none lg:grid-cols-3'
          >
            <QueryBoundary query={notesQuery}>
              {() => (
                <>
                  <For
                    each={notes}
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
                </>
              )}
            </QueryBoundary>
          </div>
        </SignedIn>
        <SignedOut>
          <SignIn />
        </SignedOut>
      </div>
    </>
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
