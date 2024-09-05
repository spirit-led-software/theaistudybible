import { db } from '@/core/database';
import { NoteItemCard } from '@/www/components/bible/reader/activity-panel/notes/note-item-card';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Spinner } from '@/www/components/ui/spinner';
import { H2, H6 } from '@/www/components/ui/typography';
import type { RouteDefinition } from '@solidjs/router';
import { A } from '@solidjs/router';
import { createInfiniteQuery, useQueryClient } from '@tanstack/solid-query';
import { SignedIn, SignedOut, SignIn } from 'clerk-solidjs';
import { auth } from 'clerk-solidjs/server';
import { createEffect, For, Match, Switch } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { TransitionGroup } from 'solid-transition-group';

const getNotes = async ({ limit, offset }: { limit: number; offset: number }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    return {
      notes: [],
      nextCursor: undefined,
    };
  }
  const [verseNotes, chapterNotes] = await Promise.all([
    db.query.verseNotes.findMany({
      where: (verseNotes, { eq }) => eq(verseNotes.userId, userId),
      with: {
        verse: {
          columns: {
            content: false,
          },
          with: {
            chapter: {
              columns: {
                content: false,
              },
            },
            bible: true,
            book: true,
          },
        },
      },
      limit,
      offset,
    }),
    db.query.chapterNotes.findMany({
      where: (chapterNotes, { eq }) => eq(chapterNotes.userId, userId),
      with: {
        chapter: {
          columns: {
            content: false,
          },
          with: {
            bible: true,
            book: true,
          },
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
};

const getNotesQueryOptions = () => ({
  queryKey: ['notes'],
  queryFn: ({ pageParam }: { pageParam: number }) => getNotes({ limit: 9, offset: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getNotes>>) => lastPage.nextCursor,
});

export const route: RouteDefinition = {
  preload: () => {
    const qc = useQueryClient();
    void qc.prefetchInfiniteQuery(getNotesQueryOptions());
  },
};

const NotesPage = () => {
  const notesQuery = createInfiniteQuery(() => getNotesQueryOptions());

  const [notes, setNotes] = createStore(notesQuery.data?.pages.flatMap((page) => page.notes) || []);
  createEffect(() => {
    setNotes(reconcile(notesQuery.data?.pages.flatMap((page) => page.notes) || []));
  });

  return (
    <div class="flex h-full w-full flex-col items-center justify-center p-5">
      <SignedIn>
        <H2 class="from-accent-foreground to-primary dark:from-accent-foreground dark:to-secondary-foreground inline-block bg-gradient-to-r bg-clip-text text-transparent">
          Your Notes
        </H2>
        <div class="mt-5 grid w-full max-w-lg grid-cols-1 gap-3 lg:max-w-none lg:grid-cols-3">
          <QueryBoundary query={notesQuery}>
            {() => (
              <TransitionGroup name="card-item">
                <For
                  each={notes}
                  fallback={
                    <div class="flex h-full w-full flex-col items-center justify-center p-5 transition-all lg:col-span-3">
                      <H6 class="text-center">
                        No notes yet, get{' '}
                        <A href="/bible" class="hover:underline">
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
                <div class="flex w-full justify-center lg:col-span-3">
                  <Switch>
                    <Match when={notesQuery.isFetchingNextPage}>
                      <Spinner size="sm" />
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

export default NotesPage;
