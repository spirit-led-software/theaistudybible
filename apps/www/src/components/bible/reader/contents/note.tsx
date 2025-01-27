import type { NoteContent as NoteContentType } from '@/schemas/bibles/contents';
import { Button } from '@/www/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/www/components/ui/popover';
import { Notebook } from 'lucide-solid';
import { Contents } from './index';

export type NoteContentProps = {
  content: NoteContentType;
};

export function NoteContent(props: NoteContentProps) {
  return (
    <Popover placement='top'>
      <PopoverTrigger as={Button} variant='ghost' size='sm' class='mx-1 size-6 p-1.5'>
        <Notebook />
      </PopoverTrigger>
      <PopoverContent class='eb-container w-52 p-2'>
        <Contents contents={props.content.contents} class='text-sm' />
      </PopoverContent>
    </Popover>
  );
}
