import type { VerseNote } from '@/schemas/bibles';
import type { VerseContent as VerseContentType } from '@/schemas/bibles/contents';
import { Button } from '@/www/components/ui/button';
import { Markdown } from '@/www/components/ui/markdown';
import { Popover, PopoverContent, PopoverTrigger } from '@/www/components/ui/popover';
import { H5 } from '@/www/components/ui/typography';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { A } from '@solidjs/router';
import { Notebook } from 'lucide-solid';
import { For, Show } from 'solid-js';

export type VerseContentProps = {
  content: VerseContentType;
  notes?: VerseNote[];
  style?: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  props: any;
  class?: string;
};

export const VerseContent = (props: VerseContentProps) => {
  const [brStore] = useBibleReaderStore();

  return (
    <span
      id={props.content.id}
      data-type={props.content.type}
      {...props.props}
      class={cn(props.style, 'inline-flex gap-1', props.class)}
    >
      <A
        href={`/bible/${brStore.bible.abbreviation}/${brStore.book.code}/${brStore.chapter.number}/${props.content.number}`}
        class='hover:underline'
      >
        {props.content.number}
      </A>
      <Show
        when={
          props.notes?.some((note) => note.verseId === props.content.id) &&
          props.notes?.filter((note) => note.verseId === props.content.id)
        }
        keyed
      >
        {(notes) => (
          <Popover>
            <PopoverTrigger as={Button} variant='ghost' size='icon' class='size-4 p-0'>
              <Notebook size={12} />
            </PopoverTrigger>
            <PopoverContent class='flex max-h-96 w-80 flex-col gap-2 overflow-y-auto p-4'>
              <H5>User note{notes.length > 1 ? 's' : ''}</H5>
              <For each={notes}>
                {(note) => (
                  <div class='flex max-h-52 w-full shrink-0 flex-col overflow-y-auto rounded-lg border p-2'>
                    <Markdown>{note.content}</Markdown>
                  </div>
                )}
              </For>
            </PopoverContent>
          </Popover>
        )}
      </Show>
    </span>
  );
};
