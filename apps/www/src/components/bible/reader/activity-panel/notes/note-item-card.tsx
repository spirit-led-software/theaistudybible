import { db } from '@/core/database';
import { chapterNotes, verseNotes } from '@/core/database/schema';
import type { Bible, Book, Chapter, ChapterNote, Verse, VerseNote } from '@/schemas/bibles/types';
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
import { Markdown } from '@/www/components/ui/markdown';
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldLabel,
  TextFieldTextArea,
} from '@/www/components/ui/text-field';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { requireAuth } from '@/www/server/auth';
import { A, action, useAction } from '@solidjs/router';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { and, eq } from 'drizzle-orm';
import { HelpCircle } from 'lucide-solid';
import { Show, createSignal } from 'solid-js';

const editNoteAction = action(
  async (props: {
    type: 'chapter' | 'verse';
    bibleAbbreviation: string;
    code: string;
    content: string;
  }) => {
    'use server';
    const { user } = requireAuth();
    let note: VerseNote | ChapterNote;
    if (props.type === 'chapter') {
      [note] = await db
        .update(chapterNotes)
        .set({ content: props.content })
        .where(
          and(
            eq(chapterNotes.userId, user.id),
            eq(chapterNotes.bibleAbbreviation, props.bibleAbbreviation),
            eq(chapterNotes.chapterCode, props.code),
          ),
        )
        .returning();
    } else if (props.type === 'verse') {
      [note] = await db
        .update(verseNotes)
        .set({ content: props.content })
        .where(
          and(
            eq(verseNotes.userId, user.id),
            eq(verseNotes.bibleAbbreviation, props.bibleAbbreviation),
            eq(verseNotes.verseCode, props.code),
          ),
        )
        .returning();
    } else {
      throw new Error('Invalid note type');
    }
    return { note };
  },
);

const deleteNoteAction = action(
  async (props: {
    type: 'chapter' | 'verse';
    bibleAbbreviation: string;
    code: string;
  }) => {
    'use server';
    const { user } = requireAuth();
    if (props.type === 'chapter') {
      await db
        .delete(chapterNotes)
        .where(
          and(
            eq(chapterNotes.userId, user.id),
            eq(chapterNotes.bibleAbbreviation, props.bibleAbbreviation),
            eq(chapterNotes.chapterCode, props.code),
          ),
        );
    } else if (props.type === 'verse') {
      await db
        .delete(verseNotes)
        .where(
          and(
            eq(verseNotes.userId, user.id),
            eq(verseNotes.bibleAbbreviation, props.bibleAbbreviation),
            eq(verseNotes.verseCode, props.code),
          ),
        );
    } else {
      throw new Error('Invalid note type');
    }
    return { success: true };
  },
);

export type NoteItemCardProps = {
  note: ChapterNote | VerseNote;
  bible: Bible;
  book: Book;
  chapter: Omit<Chapter, 'content'>;
  verse?: Omit<Verse, 'content'>;
  showViewButton?: boolean;
};

export const NoteItemCard = (props: NoteItemCardProps) => {
  const editNote = useAction(editNoteAction);
  const deleteNote = useAction(deleteNoteAction);

  const qc = useQueryClient();

  const [isEditingNote, setIsEditingNote] = createSignal(false);
  const [editNoteContent, setEditNoteContent] = createSignal(props.note.content);
  const [showPreview, setShowPreview] = createSignal(false);

  const editNoteMutation = createMutation(() => ({
    mutationFn: (mProps: {
      type: 'verse' | 'chapter';
      bibleAbbreviation: string;
      code: string;
      content: string;
    }) => editNote(mProps),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['notes'],
      }),
  }));

  const deleteNoteMutation = createMutation(() => ({
    mutationFn: (mProps: {
      type: 'verse' | 'chapter';
      bibleAbbreviation: string;
      code: string;
    }) => deleteNote(mProps),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['notes'],
      }),
  }));

  return (
    <Card class='flex h-full max-h-[400px] w-full flex-col transition-all'>
      <CardHeader>
        <CardTitle>
          {props.verse
            ? `${props.book.shortName} ${props.chapter.number}:${props.verse.number}`
            : `${props.book.shortName} ${props.chapter.number}`}
        </CardTitle>
      </CardHeader>
      <CardContent class='flex grow flex-col overflow-y-auto'>
        <Show
          when={isEditingNote()}
          fallback={
            <div class='overflow-y-auto whitespace-pre-wrap rounded-lg border bg-background p-2'>
              <Markdown>{props.note.content}</Markdown>
            </div>
          }
        >
          <TextField
            value={editNoteContent()}
            onChange={setEditNoteContent}
            validationState={editNoteContent().trim() ? 'valid' : 'invalid'}
            class='space-y-2'
          >
            <div class='flex w-full items-center justify-between'>
              <Tooltip>
                <TooltipTrigger as={TextFieldLabel} class='flex items-center'>
                  Content <HelpCircle size={16} class='ml-1' />
                </TooltipTrigger>
                <TooltipContent>
                  Accepts{' '}
                  <Button
                    as={A}
                    variant='link'
                    size='sm'
                    class='p-0'
                    href='https://www.markdownguide.org/'
                  >
                    markdown
                  </Button>
                </TooltipContent>
              </Tooltip>
              <TextFieldLabel
                as={Button}
                variant='link'
                size='sm'
                class='p-0 text-xs hover:no-underline'
                onClick={() => setShowPreview(!showPreview())}
              >
                {showPreview() ? 'Hide Preview' : 'Show Preview'}
              </TextFieldLabel>
            </div>
            <Show
              when={!showPreview()}
              fallback={
                <div class='whitespace-pre-wrap rounded-lg border bg-background p-5'>
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
      <CardFooter class='flex justify-end space-x-2'>
        <Show
          when={!isEditingNote()}
          fallback={
            <>
              <Button variant='outline' onClick={() => setIsEditingNote(false)}>
                Cancel
              </Button>
              <Button
                disabled={!editNoteContent().trim()}
                onClick={() => {
                  setIsEditingNote(false);
                  editNoteMutation.mutate({
                    type: 'verseCode' in props.note ? 'verse' : 'chapter',
                    bibleAbbreviation: props.bible.abbreviation,
                    code: 'verseCode' in props.note ? props.note.verseCode : props.note.chapterCode,
                    content: editNoteContent(),
                  });
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
              variant='outline'
              onClick={() => {
                setIsEditingNote(false);
              }}
            >
              Delete
            </DialogTrigger>
            <DialogContent class='space-y-2 sm:max-w-[425px]'>
              <DialogHeader>
                <DialogTitle>Are you sure you want to delete this note?</DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type='submit'
                  variant='destructive'
                  onClick={() => {
                    deleteNoteMutation.mutate({
                      type: 'verseCode' in props.note ? 'verse' : 'chapter',
                      bibleAbbreviation: props.bible.abbreviation,
                      code:
                        'verseCode' in props.note ? props.note.verseCode : props.note.chapterCode,
                    });
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
              href={`/bible/${props.bible.abbreviation}/${props.book.code}/${props.chapter.number}${props.verse ? `/${props.verse.number}` : ''}`}
            >
              View
            </Button>
          </Show>
        </Show>
      </CardFooter>
    </Card>
  );
};
