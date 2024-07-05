import { createInfiniteQuery } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { ChapterNote, VerseNote } from '@theaistudybible/core/model/bible';
import { Plus } from 'lucide-solid';
import { createEffect, createSignal, For, Show } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { SignedIn, SignedOut, SignInButton } from '~/components/clerk';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { DrawerClose } from '~/components/ui/drawer';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { H5, P } from '~/components/ui/typography';
import { auth } from '~/lib/server/clerk';
import { AddNoteCard } from './add-note-card';
import { NoteItemCard } from './note-item-card';

const getNotes = async (props: {
  chapterId: string;
  verseIds?: string[];
  offset: number;
  limit: number;
}) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    return {
      notes: [],
      nextCursor: undefined
    };
  }

  if (props.verseIds?.length) {
    const notes = await db.query.verseNotes.findMany({
      where: (verseNotes, { and, eq, inArray }) =>
        and(eq(verseNotes.userId, userId), inArray(verseNotes.verseId, props.verseIds!)),
      orderBy: (verseNotes, { desc }) => desc(verseNotes.updatedAt),
      offset: props.offset,
      limit: props.limit
    });

    return {
      notes,
      nextCursor: notes.length === props.limit ? props.offset + notes.length : undefined
    };
  } else {
    const notes = await db.query.chapterNotes.findMany({
      where: (chapterNotes, { and, eq }) =>
        and(eq(chapterNotes.userId, userId), eq(chapterNotes.chapterId, props.chapterId)),
      orderBy: (chapterNotes, { desc }) => desc(chapterNotes.updatedAt),
      offset: props.offset,
      limit: props.limit
    });

    return {
      notes,
      nextCursor: notes.length === props.limit ? props.offset + notes.length : undefined
    };
  }
};

export const NotesCard = () => {
  const [brStore] = useBibleReaderStore();

  const query = createInfiniteQuery(() => ({
    queryKey: [
      'notes',
      {
        chapterId: brStore.chapter.id,
        verseIds: brStore.verse ? [brStore.verse.id] : brStore.selectedVerseInfos.map((v) => v.id)
      }
    ],
    queryFn: ({ pageParam }) =>
      getNotes({
        chapterId: brStore.chapter.id,
        verseIds: brStore.verse ? [brStore.verse.id] : brStore.selectedVerseInfos.map((v) => v.id),
        offset: pageParam,
        limit: 9
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0
  }));

  const [notes, setNotes] = createStore(
    query.data?.pages.flatMap((page) => page.notes as (ChapterNote | VerseNote)[]) || []
  );
  createEffect(() => {
    setNotes(
      reconcile(
        query.data?.pages.flatMap((page) => page.notes as (ChapterNote | VerseNote)[]) || []
      )
    );
  });

  const [isAddingNote, setIsAddingNote] = createSignal(false);

  return (
    <Card class="flex w-full flex-1 flex-col overflow-y-auto">
      <SignedIn>
        <CardHeader class="flex flex-row items-center justify-between border-b shadow-sm">
          <CardTitle>Notes</CardTitle>
          <Tooltip>
            <TooltipTrigger as={Button} onClick={() => setIsAddingNote(true)} size="icon">
              <Plus class="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Add Note</TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent class="overflow-y-auto py-4">
          <div class="grid grid-cols-1 gap-2">
            <Show when={isAddingNote()}>
              <AddNoteCard
                onAdd={() => setIsAddingNote(false)}
                onCancel={() => setIsAddingNote(false)}
              />
            </Show>
            <For
              each={notes}
              fallback={
                <div class="flex h-full w-full flex-col items-center justify-center p-5">
                  <H5>No notes</H5>
                </div>
              }
            >
              {(note) => <NoteItemCard note={note} />}
            </For>
          </div>
        </CardContent>
        <CardFooter class="flex justify-end gap-2 border-t pt-4">
          <DrawerClose as={Button} variant="outline">
            Close
          </DrawerClose>
        </CardFooter>
      </SignedIn>
      <SignedOut>
        <CardHeader />
        <CardContent class="flex w-full flex-1 flex-col place-items-center justify-center pt-6">
          <div class="flex h-full w-full flex-col place-items-center justify-center">
            <P class="text-lg">
              Please{' '}
              <SignInButton
                variant={'link'}
                class="px-0 text-lg capitalize text-accent-foreground"
              />{' '}
              to take notes
            </P>
          </div>
        </CardContent>
        <CardFooter class="flex justify-end">
          <DrawerClose as={Button} variant="outline">
            Close
          </DrawerClose>
        </CardFooter>
      </SignedOut>
    </Card>
  );
};
