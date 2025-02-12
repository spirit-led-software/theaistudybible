import type { NoteContent as NoteContentType } from '@/schemas/bibles/contents';
import { Button } from '@/www/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/www/components/ui/popover';
import { MessageCircleMore } from 'lucide-solid';
import { Contents } from './index';

export type NoteContentProps = {
  content: NoteContentType;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  props: any;
};

export function NoteContent(props: NoteContentProps) {
  return (
    <Popover placement='top'>
      <PopoverTrigger
        as={Button}
        variant='ghost'
        size='sm'
        id={props.content.id}
        data-type={props.content.type}
        data-verse-number={props.content.verseNumber}
        {...props.props}
        class='mx-0.25 size-6 p-1.5 align-sub'
      >
        <MessageCircleMore />
      </PopoverTrigger>
      <PopoverContent class='eb-container w-52 p-2'>
        <Contents contents={props.content.contents} class='text-sm' />
      </PopoverContent>
    </Popover>
  );
}
