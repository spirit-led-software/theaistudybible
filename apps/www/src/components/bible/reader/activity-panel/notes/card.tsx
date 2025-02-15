import { db } from '@/core/database';
import type { Prettify } from '@/core/types/util';
import { SignedIn } from '@/www/components/auth/control';
import { SignInButton } from '@/www/components/auth/sign-in-button';
import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import { DrawerClose } from '@/www/components/ui/drawer';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { H5, P } from '@/www/components/ui/typography';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { auth } from '@/www/server/utils/auth';
import { createAutoAnimate } from '@formkit/auto-animate/solid';
import { GET } from '@solidjs/start';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { Plus } from 'lucide-solid';
import { For, Show, createEffect, createSignal } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { AddNoteCard } from './add-note-card';
import { NoteItemCard } from './note-item-card';

const getNotes = GET(
  async (props: {
    bibleAbbreviation: string;
    chapterCode: string;
    verseNumbers?: number[];
    offset: number;
    limit: number;
  }) => {
    'use server';
    const { user } = auth();
    if (!user) {
      return { notes: [], nextCursor: null };
    }

    let notes = [];
    if (props.verseNumbers?.length) {
      notes = await db.query.verseNotes.findMany({
        where: (verseNotes, { and, eq, inArray }) =>
          and(
            eq(verseNotes.userId, user.id),
            eq(verseNotes.bibleAbbreviation, props.bibleAbbreviation),
            inArray(
              verseNotes.verseCode,
              props.verseNumbers!.map((vn) => `${props.chapterCode}.${vn}`),
            ),
          ),
        orderBy: (verseNotes, { desc }) => desc(verseNotes.updatedAt),
        offset: props.offset,
        limit: props.limit,
        with: {
          verse: {
            columns: { content: false },
            with: { book: true, chapter: { columns: { content: false } }, bible: true },
          },
        },
      });
    } else {
      notes = await db.query.chapterNotes.findMany({
        where: (chapterNotes, { and, eq }) =>
          and(
            eq(chapterNotes.userId, user.id),
            eq(chapterNotes.bibleAbbreviation, props.bibleAbbreviation),
            eq(chapterNotes.chapterCode, props.chapterCode),
          ),
        orderBy: (chapterNotes, { desc }) => desc(chapterNotes.updatedAt),
        offset: props.offset,
        limit: props.limit,
        with: { chapter: { columns: { content: false }, with: { book: true, bible: true } } },
      });
    }

    return {
      notes,
      nextCursor: notes.length === props.limit ? props.offset + notes.length : null,
    };
  },
);

export const NotesCard = () => {
  const [brStore] = useBibleReaderStore();

  const query = createInfiniteQuery(() => ({
    queryKey: [
      'notes',
      {
        bibleAbbreviation: brStore.bible.abbreviation,
        chapterCode: brStore.chapter.code,
        verseNumbers: brStore.verse
          ? [brStore.verse.number]
          : brStore.selectedVerseInfos.map((v) => v.number),
      },
    ],
    queryFn: ({ pageParam }) =>
      getNotes({
        bibleAbbreviation: brStore.bible.abbreviation,
        chapterCode: brStore.chapter.code,
        verseNumbers: brStore.verse
          ? [brStore.verse.number]
          : brStore.selectedVerseInfos.map((v) => v.number),
        offset: pageParam,
        limit: 9,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  }));

  type NoteType = Prettify<Awaited<ReturnType<typeof getNotes>>['notes']>[number];
  const [notes, setNotes] = createStore<NoteType[]>([]);
  createEffect(() => {
    if (query.status === 'success') {
      setNotes(
        reconcile(
          // @ts-expect-error - Types are messed up for some reason
          query.data.pages.flatMap((page) => page.notes),
        ),
      );
    }
  });

  const [setAutoAnimateRef] = createAutoAnimate();
  const [isAddingNote, setIsAddingNote] = createSignal(false);

  return (
    <Card class='flex w-full flex-1 flex-col overflow-y-auto'>
      <SignedIn
        fallback={
          <>
            <CardHeader />
            <CardContent class='flex w-full flex-1 flex-col place-items-center justify-center pt-6'>
              <div class='flex h-full w-full flex-col place-items-center justify-center'>
                <P class='text-lg'>
                  Please <Button as={SignInButton} /> to take notes
                </P>
              </div>
            </CardContent>
            <CardFooter class='flex justify-end'>
              <DrawerClose as={Button} variant='outline'>
                Close
              </DrawerClose>
            </CardFooter>
          </>
        }
      >
        <CardHeader class='flex flex-row items-center justify-between border-b shadow-xs'>
          <CardTitle>Notes</CardTitle>
          <Tooltip>
            <TooltipTrigger as={Button} onClick={() => setIsAddingNote(true)} size='icon'>
              <Plus class='h-4 w-4' />
            </TooltipTrigger>
            <TooltipContent>Add Note</TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent class='overflow-y-auto py-4'>
          <div ref={setAutoAnimateRef} class='grid grid-cols-1 gap-2'>
            <Show when={isAddingNote()}>
              <AddNoteCard
                onAdd={() => setIsAddingNote(false)}
                onCancel={() => setIsAddingNote(false)}
              />
            </Show>
            <For
              each={notes}
              fallback={
                <div class='flex h-full w-full flex-col items-center justify-center p-5 transition-all'>
                  <H5>No notes</H5>
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
                />
              )}
            </For>
          </div>
        </CardContent>
        <CardFooter class='flex justify-end gap-2 border-t pt-4'>
          <DrawerClose as={Button} variant='outline'>
            Close
          </DrawerClose>
        </CardFooter>
      </SignedIn>
    </Card>
  );
};
