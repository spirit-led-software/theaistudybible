import { A } from '@solidjs/router';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { chapterNotes, verseNotes } from '@theaistudybible/core/database/schema';
import { contentsToText } from '@theaistudybible/core/util/bible';
import { HelpCircle } from 'lucide-solid';
import { createSignal, Show } from 'solid-js';
import { SelectedVerseInfo, useBibleReaderStore } from '~/components/providers/bible-reader';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Markdown } from '~/components/ui/markdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select';
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldLabel,
  TextFieldTextArea
} from '~/components/ui/text-field';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { P } from '~/components/ui/typography';
import { auth } from '~/lib/server/clerk';

const addNote = async (props: { chapterId: string; verseId?: string; content: string }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  if (props.verseId) {
    await db.insert(verseNotes).values({
      userId,
      verseId: props.verseId,
      content: props.content
    });
  } else {
    await db.insert(chapterNotes).values({
      userId,
      chapterId: props.chapterId,
      content: props.content
    });
  }
};

export type AddNoteCardProps = {
  onAdd?: () => void;
  onCancel?: () => void;
};

export const AddNoteCard = (props: AddNoteCardProps) => {
  const [brStore] = useBibleReaderStore();

  const [selectedVerseInfo, setSelectedVerseInfo] = createSignal<SelectedVerseInfo | undefined>(
    brStore.selectedVerseInfos[0]
  );
  const [contentValue, setContentValue] = createSignal('');
  const [showPreview, setShowPreview] = createSignal(false);

  const qc = useQueryClient();

  const addNoteMutation = createMutation(() => ({
    mutationFn: (props: { chapterId: string; verseId?: string; content: string }) => addNote(props),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['notes']
      })
  }));

  return (
    <Card class="transition-all">
      <CardHeader>
        <CardTitle>Add Note</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <Show when={!brStore.verse && brStore.selectedVerseInfos.length}>
          <div class="flex items-center space-x-1">
            <Label for="verse-select">Verse</Label>
            <Select<SelectedVerseInfo>
              id="verse-select"
              value={selectedVerseInfo()}
              onChange={setSelectedVerseInfo}
              options={brStore.selectedVerseInfos}
              optionValue="id"
              optionTextValue="number"
              itemComponent={(props) => (
                <SelectItem item={props.item}>{props.item.rawValue.number}</SelectItem>
              )}
            >
              <SelectTrigger aria-label="Verse Number">
                <SelectValue<SelectedVerseInfo>>
                  {(state) => state.selectedOption().number}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>
        </Show>
        <Show when={brStore.verse || brStore.selectedVerseInfos.length}>
          <P>
            {brStore.verse
              ? contentsToText(brStore.verse.content)
              : brStore.selectedVerseInfos.find((v) => v.id === selectedVerseInfo()?.id)?.text}
          </P>
        </Show>
        <TextField
          value={contentValue()}
          onChange={setContentValue}
          validationState={contentValue().trim() ? 'valid' : 'invalid'}
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
                <Markdown>{contentValue()}</Markdown>
              </div>
            }
          >
            <TextFieldTextArea data-corvu-no-drag />
          </Show>
          <TextFieldErrorMessage>Cannot be empty</TextFieldErrorMessage>
        </TextField>
      </CardContent>
      <CardFooter class="flex justify-end space-x-2">
        <Button onClick={props.onCancel} variant="outline">
          Cancel
        </Button>
        <Button
          disabled={!contentValue().trim()}
          onClick={() => {
            addNoteMutation.mutate({
              chapterId: brStore.chapter.id,
              verseId: brStore.verse?.id ?? selectedVerseInfo()?.id,
              content: contentValue()
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
