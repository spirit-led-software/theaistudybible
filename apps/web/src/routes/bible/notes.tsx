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
import { Markdown } from '~/components/ui/markdown';
import { Spinner } from '~/components/ui/spinner';
import { H2, H6, P } from '~/components/ui/typography';
import { auth } from '~/lib/server/clerk';

const getNotes = async ({ limit, offset }: { limit: number; offset: number }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    return {
      notes: [],
      nextCursor: undefined
    };
  }
  const [verseNotes, chapterNotes] = await Promise.all([
    db.query.verseNotes.findMany({
      where: (verseNotes, { eq }) => eq(verseNotes.userId, userId),
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
    db.query.chapterNotes.findMany({
      where: (chapterNotes, { eq }) => eq(chapterNotes.userId, userId),
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

  const notes = [...verseNotes, ...chapterNotes];

  return {
    notes,
    nextCursor: notes.length === limit ? offset + limit : undefined
  };
};

const getNotesQueryOptions = () => ({
  queryKey: ['notes'],
  queryFn: ({ pageParam }: { pageParam: number }) => getNotes({ limit: 9, offset: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getNotes>>) => lastPage.nextCursor
});

export const route: RouteDefinition = {
  load: () => {
    const qc = useQueryClient();
    qc.prefetchInfiniteQuery(getNotesQueryOptions());
  }
};

const NotesPage = () => {
  const query = createInfiniteQuery(() => getNotesQueryOptions());

  const [notes, setNotes] = createStore(query.data?.pages.flatMap((page) => page.notes) || []);
  createEffect(() => {
    setNotes(reconcile(query.data?.pages.flatMap((page) => page.notes) || []));
  });

  return (
    <div class="flex h-full w-full flex-col items-center justify-center p-5">
      <SignedIn>
        <H2 class="inline-block bg-gradient-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
          Your Notes
        </H2>
        <QueryBoundary query={query}>
          {() => (
            <div class="mt-5 grid w-full max-w-lg grid-cols-1 gap-3 lg:max-w-none lg:grid-cols-3">
              <For
                each={notes}
                fallback={
                  <div class="flex h-full w-full flex-col items-center justify-center p-5">
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
                {(note) => (
                  <Switch>
                    <Match when={'verse' in note && note.verse} keyed>
                      {(verse) => (
                        <A
                          href={`/bible/${verse.bible.abbreviation}/${verse.book.abbreviation}/${verse.chapter.number}/${verse.number}`}
                        >
                          <Card class="h-full w-full">
                            <CardHeader>
                              <CardTitle class="text-center">{verse.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div class="flex flex-col space-y-4">
                                <div class="flex flex-col space-y-1">
                                  <H6>Content</H6>
                                  <P>{contentsToText(verse.content)}</P>
                                </div>
                                <div class="flex flex-col space-y-1">
                                  <H6>Note</H6>
                                  <div class="whitespace-pre-wrap rounded-lg bg-background p-5">
                                    <Markdown>{note.content}</Markdown>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </A>
                      )}
                    </Match>
                    <Match when={'chapter' in note && note.chapter} keyed>
                      {(chapter) => (
                        <A
                          href={`/bible/${chapter.bible.abbreviation}/${chapter.book.abbreviation}/${chapter.number}`}
                        >
                          <Card class="h-full w-full">
                            <CardHeader>
                              <CardTitle class="text-center">{chapter.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div class="flex flex-col space-y-4">
                                <div class="flex flex-col space-y-1">
                                  <H6>Content</H6>
                                  <P>Click to view</P>
                                </div>
                                <div class="flex flex-col space-y-1">
                                  <H6>Note</H6>
                                  <div class="whitespace-pre-wrap rounded-lg bg-background p-5">
                                    <Markdown>{note.content}</Markdown>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
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

export default NotesPage;
