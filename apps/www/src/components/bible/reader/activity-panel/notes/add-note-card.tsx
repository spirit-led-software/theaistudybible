import { db } from '@/core/database';
import { chapterNotes, verseNotes } from '@/core/database/schema';
import { contentsToText } from '@/core/utils/bibles/contents-to-text';
import type { ChapterNote, VerseNote } from '@/schemas/bibles/types';
import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import { Label } from '@/www/components/ui/label';
import { Markdown } from '@/www/components/ui/markdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/www/components/ui/select';
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldLabel,
  TextFieldTextArea,
} from '@/www/components/ui/text-field';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { P } from '@/www/components/ui/typography';
import type { SelectedVerseInfo } from '@/www/contexts/bible-reader';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { requireAuth } from '@/www/server/auth';
import { A, action, useAction } from '@solidjs/router';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { HelpCircle } from 'lucide-solid';
import { Show, createSignal } from 'solid-js';

const addNoteAction = action(
  async (props: { chapterId: string; verseId?: string; content: string }) => {
    'use server';
    const { user } = requireAuth();
    let note: VerseNote | ChapterNote;
    if (props.verseId) {
      [note] = await db
        .insert(verseNotes)
        .values({
          userId: user.id,
          verseId: props.verseId,
          content: props.content,
        })
        .returning();
    } else {
      [note] = await db
        .insert(chapterNotes)
        .values({
          userId: user.id,
          chapterId: props.chapterId,
          content: props.content,
        })
        .returning();
    }
    return { note };
  },
);

export type AddNoteCardProps = {
  onAdd?: () => void;
  onCancel?: () => void;
};

export const AddNoteCard = (props: AddNoteCardProps) => {
  const addNote = useAction(addNoteAction);

  const qc = useQueryClient();
  const [brStore] = useBibleReaderStore();

  const [selectedVerseInfo, setSelectedVerseInfo] = createSignal<SelectedVerseInfo | undefined>(
    brStore.selectedVerseInfos[0],
  );
  const [contentValue, setContentValue] = createSignal('');
  const [showPreview, setShowPreview] = createSignal(false);

  const addNoteMutation = createMutation(() => ({
    mutationFn: (props: { chapterId: string; verseId?: string; content: string }) => addNote(props),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['notes'],
      }),
  }));

  return (
    <Card class='transition-all'>
      <CardHeader>
        <CardTitle>Add Note</CardTitle>
      </CardHeader>
      <CardContent class='space-y-4'>
        <Show when={!brStore.verse && brStore.selectedVerseInfos.length}>
          <div class='flex items-center space-x-1'>
            <Label for='verse-select'>Verse</Label>
            <Select<SelectedVerseInfo>
              id='verse-select'
              value={selectedVerseInfo()}
              onChange={setSelectedVerseInfo}
              options={brStore.selectedVerseInfos}
              optionValue='id'
              optionTextValue='number'
              itemComponent={(props) => (
                <SelectItem item={props.item}>{props.item.rawValue.number}</SelectItem>
              )}
            >
              <SelectTrigger aria-label='Verse Number'>
                <SelectValue<SelectedVerseInfo>>
                  {(state) => state.selectedOption().number}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>
        </Show>
        <Show when={brStore.verse?.content?.length || brStore.selectedVerseInfos.length}>
          <P>
            {brStore.verse
              ? contentsToText(brStore.verse.content!)
              : brStore.selectedVerseInfos.find((v) => v.id === selectedVerseInfo()?.id)?.text}
          </P>
        </Show>
        <TextField
          value={contentValue()}
          onChange={setContentValue}
          validationState={contentValue().trim() ? 'valid' : 'invalid'}
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
                <Markdown>{contentValue()}</Markdown>
              </div>
            }
          >
            <TextFieldTextArea data-corvu-no-drag />
          </Show>
          <TextFieldErrorMessage>Cannot be empty</TextFieldErrorMessage>
        </TextField>
      </CardContent>
      <CardFooter class='flex justify-end space-x-2'>
        <Button onClick={props.onCancel} variant='outline'>
          Cancel
        </Button>
        <Button
          disabled={!contentValue().trim()}
          onClick={() => {
            addNoteMutation.mutate({
              chapterId: brStore.chapter.id,
              verseId: brStore.verse?.id ?? selectedVerseInfo()?.id,
              content: contentValue(),
            });
            props.onAdd?.();
          }}
        >
          Save
        </Button>
      </CardFooter>
    </Card>
  );
};
