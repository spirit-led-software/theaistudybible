import { Bible, Book, Chapter } from '@theaistudybible/core/model/bible';
import type { NoteContent as NoteContentType } from '@theaistudybible/core/types/bible';
import { NotepadTextIcon } from 'lucide-solid';
import { Button } from '~/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import Contents from './contents';

export type NoteContentProps = {
  bible: Bible;
  book: Book;
  chapter: Chapter;
  content: NoteContentType;
  highlights?: {
    id: string;
    color: string;
  }[];
};

export default function NoteContent({
  bible,
  book,
  chapter,
  content,
  highlights
}: NoteContentProps) {
  return (
    <Popover placement="top">
      <PopoverTrigger class="mx-1 px-2 py-0" as={Button} variant="ghost" size="sm">
        <NotepadTextIcon size={12} />
      </PopoverTrigger>
      <PopoverContent class="eb-container w-52 p-2">
        <Contents
          bible={bible}
          book={book}
          chapter={chapter}
          contents={content.contents}
          highlights={highlights}
          class="text-sm"
        />
      </PopoverContent>
    </Popover>
  );
}
