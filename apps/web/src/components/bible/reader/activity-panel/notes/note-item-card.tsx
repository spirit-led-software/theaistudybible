import { A } from '@solidjs/router';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { chapterNotes, verseNotes } from '@theaistudybible/core/database/schema';
import {
  Bible,
  Book,
  Chapter,
  ChapterNote,
  Verse,
  VerseNote
} from '@theaistudybible/core/model/bible';
import { and, eq } from 'drizzle-orm';
import { HelpCircle } from 'lucide-solid';
import { createSignal, Show } from 'solid-js';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog';
import { Markdown } from '~/components/ui/markdown';
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldLabel,
  TextFieldTextArea
} from '~/components/ui/text-field';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { auth } from '~/lib/server/clerk';

const editNote = async (props: { type: 'chapter' | 'verse'; noteId: string; content: string }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  if (props.type === 'chapter') {
    await db
      .update(chapterNotes)
      .set({ content: props.content })
      .where(and(eq(chapterNotes.userId, userId), eq(chapterNotes.id, props.noteId)));
  } else {
    await db
      .update(verseNotes)
      .set({ content: props.content })
      .where(and(eq(verseNotes.userId, userId), eq(verseNotes.id, props.noteId)));
  }
};

const deleteNote = async (props: { type: 'chapter' | 'verse'; noteId: string }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  if (props.type === 'chapter') {
    await db
      .delete(chapterNotes)
      .where(and(eq(chapterNotes.userId, userId), eq(chapterNotes.id, props.noteId)));
  } else {
    await db
      .delete(verseNotes)
      .where(and(eq(verseNotes.userId, userId), eq(verseNotes.id, props.noteId)));
  }
};

export type NoteItemCardProps = {
  note: ChapterNote | VerseNote;
  bible: Bible;
  book: Book;
  chapter: Omit<Chapter, 'content'>;
  verse?: Omit<Verse, 'content'>;
  showViewButton?: boolean;
};
export const NoteItemCard = (props: NoteItemCardProps) => {
  const [isEditingNote, setIsEditingNote] = createSignal(false);
  const [editNoteContent, setEditNoteContent] = createSignal(props.note.content);
  const [showPreview, setShowPreview] = createSignal(false);

  const qc = useQueryClient();

  const editNoteMutation = createMutation(() => ({
    mutationFn: (mProps: { noteId: string; content: string }) =>
      editNote({
        type: 'verseId' in props.note ? 'verse' : 'chapter',
        ...mProps
      }),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['notes']
      })
  }));

  const deleteNoteMutation = createMutation(() => ({
    mutationFn: (mProps: { noteId: string }) =>
      deleteNote({
        type: 'verseId' in props.note ? 'verse' : 'chapter',
        ...mProps
      }),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['notes']
      })
  }));

  return (
    <Card class="transition-all">
      <CardHeader>
        <CardTitle>
          {props.verse
            ? `${props.book.shortName} ${props.chapter.number}:${props.verse.number}`
            : `${props.book.shortName} ${props.chapter.number}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Show when={isEditingNote()} fallback={<Markdown>{props.note.content}</Markdown>}>
          <TextField
            value={editNoteContent()}
            onChange={setEditNoteContent}
            validationState={editNoteContent().trim() ? 'valid' : 'invalid'}
            class="space-y-2"
          >
            <div class="flex w-full items-center justify-between">
              <Tooltip>
                <TooltipTrigger as={TextFieldLabel} class="flex items-center">
                  Content <HelpCircle size={16} class="ml-1" />
                </TooltipTrigger>
                <TooltipContent>
                  Accepts{' '}
                  <Button
                    as={A}
                    variant="link"
                    size="sm"
                    class="p-0"
                    href="https://www.markdownguide.org/"
                  >
                    markdown
                  </Button>
                </TooltipContent>
              </Tooltip>
              <TextFieldLabel
                as={Button}
                variant="link"
                size="sm"
                class="p-0 text-xs hover:no-underline"
                onClick={() => setShowPreview(!showPreview())}
              >
                {showPreview() ? 'Hide Preview' : 'Show Preview'}
              </TextFieldLabel>
            </div>
            <Show
              when={!showPreview()}
              fallback={
                <div class="whitespace-pre-wrap rounded-lg border bg-background p-5">
                  <Markdown>{editNoteContent()}</Markdown>
                </div>
              }
            >
              <TextFieldTextArea data-corvu-no-drag />
            </Show>
            <TextFieldErrorMessage>Cannot be empty</TextFieldErrorMessage>
          </TextField>
        </Show>
      </CardContent>
      <CardFooter class="flex justify-end space-x-2">
        <Show
          when={!isEditingNote()}
          fallback={
            <>
              <Button variant="outline" onClick={() => setIsEditingNote(false)}>
                Cancel
              </Button>
              <Button
                disabled={!editNoteContent().trim()}
                onClick={() => {
                  setIsEditingNote(false);
                  editNoteMutation.mutate({ noteId: props.note.id, content: editNoteContent() });
                }}
              >
                Save
              </Button>
            </>
          }
        >
          <Dialog>
            <DialogTrigger
              as={Button}
              variant="outline"
              onClick={() => {
                setIsEditingNote(false);
              }}
            >
              Delete
            </DialogTrigger>
            <DialogContent class="space-y-2 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Are you sure you want to delete this note?</DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="submit"
                  variant="destructive"
                  onClick={() => {
                    deleteNoteMutation.mutate({ noteId: props.note.id });
                  }}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setIsEditingNote(!isEditingNote())}>Edit</Button>
          <Show when={props.showViewButton}>
            <Button
              as={A}
              href={`/bible/${props.bible.abbreviation}/${props.book.abbreviation}/${props.chapter.number}${props.verse ? `/${props.verse.number}` : ''}`}
            >
              View
            </Button>
          </Show>
        </Show>
      </CardFooter>
    </Card>
  );
};
