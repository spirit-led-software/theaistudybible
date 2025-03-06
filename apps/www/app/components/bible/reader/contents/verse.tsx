import type { VerseContent as VerseContentType } from '@/schemas/bibles/contents';
import type { VerseNote } from '@/schemas/bibles/verses/types';
import { Button } from '@/www/components/ui/button';
import { Markdown } from '@/www/components/ui/markdown';
import { Popover, PopoverContent, PopoverTrigger } from '@/www/components/ui/popover';
import { H5 } from '@/www/components/ui/typography';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { Link } from '@tanstack/react-router';
import { Notebook } from 'lucide-react';
import { useMemo } from 'react';

export type VerseContentProps = {
  content: VerseContentType;
  notes?: VerseNote[];
  style?: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  props: any;
  class?: string;
};

export const VerseContent = (props: VerseContentProps) => {
  const brStore = useBibleReaderStore();

  const notes = useMemo(() => {
    return props.notes?.filter(
      (note) => note.verseCode.split('.').at(-1) === props.content.number.toString(),
    );
  }, [props.notes, props.content.number]);

  return (
    <span
      id={props.content.id}
      data-type={props.content.type}
      data-verse-number={props.content.number}
      {...props.props}
      className={cn(
        props.style,
        'inline-flex transition-all duration-500 ease-in-out',
        props.class,
      )}
    >
      {notes?.length && notes.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='ghost' size='icon' className='size-6 p-1.5 align-sub'>
              <Notebook />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='flex max-h-96 w-80 flex-col gap-2 overflow-y-auto p-4'>
            <H5>User note{notes.length > 1 ? 's' : ''}</H5>
            {notes.map((note, idx) => (
              <div
                key={`${note.bibleAbbreviation}-${note.verseCode}-${idx}`}
                className='flex max-h-52 w-full shrink-0 flex-col overflow-y-auto rounded-lg border p-2'
              >
                <Markdown>{note.content}</Markdown>
              </div>
            ))}
          </PopoverContent>
        </Popover>
      )}
      <Link
        to={`/bible/${brStore.bible.abbreviation}/${brStore.book.code}/${brStore.chapter.number}/${props.content.number}`}
        className='hover:underline'
      >
        {props.content.number}
      </Link>
    </span>
  );
};
