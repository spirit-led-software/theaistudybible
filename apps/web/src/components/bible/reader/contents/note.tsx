import type { NoteContent as NoteContentType } from '@theaistudybible/core/types/bible';
import { NotepadTextIcon } from 'lucide-solid';
import { Accessor } from 'solid-js';
import { Button } from '~/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { HighlightInfo } from '~/types/bible';
import Contents from './contents';

export type NoteContentProps = {
  content: NoteContentType;
  highlights?: Accessor<HighlightInfo[]>;
};

export default function NoteContent(props: NoteContentProps) {
  return (
    <Popover placement="top">
      <PopoverTrigger class="mx-1 px-2 py-0" as={Button} variant="ghost" size="sm">
        <NotepadTextIcon size={12} />
      </PopoverTrigger>
      <PopoverContent class="eb-container w-52 p-2">
        <Contents contents={props.content.contents} highlights={props.highlights} class="text-sm" />
      </PopoverContent>
    </Popover>
  );
}
