import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { ChevronLeft, ChevronRight } from 'lucide-solid';
import { QueryBoundary } from '~/components/query-boundary';
import { cn } from '~/lib/utils';
import { buttonVariants } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import ChapterContent from './content';
import { getChapterReaderData } from './server';

export type ChapterReaderProps = {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
};

export const chapterReaderQueryOptions = (props: ChapterReaderProps) => ({
  queryKey: ['chapter-reader-window', props],
  queryFn: () => getChapterReaderData(props)
});

export default function ChapterReader(props: ChapterReaderProps) {
  const query = createQuery(() => chapterReaderQueryOptions(props));

  return (
    <QueryBoundary query={query}>
      {({ bible, book, chapter }) => (
        <div class="mt-10">
          <ChapterContent bible={bible} book={book} chapter={chapter} />
          {chapter.previous && (
            <div class="fixed bottom-1/3 left-0 top-1/3 flex flex-col place-items-center justify-center">
              <Tooltip placement="right">
                <TooltipTrigger
                  as={A}
                  class={cn(buttonVariants(), 'my-auto h-20 w-10 rounded-r-2xl')}
                  href={`/bible/${bible.abbreviation}/${chapter.previous?.abbreviation.split('.')[0]}/${chapter.previous?.number}`}
                >
                  <ChevronLeft size={20} class="shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{chapter.previous.name}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          {chapter.next && (
            <div class="fixed bottom-1/3 right-0 top-1/3 flex flex-col place-items-center justify-center">
              <Tooltip placement="left">
                <TooltipTrigger
                  as={A}
                  class={cn(buttonVariants(), 'my-auto h-20 w-10 rounded-l-2xl')}
                  href={`/bible/${bible.abbreviation}/${chapter.next?.abbreviation.split('.')[0]}/${chapter.next?.number}`}
                >
                  <ChevronRight size={20} class="shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{chapter.next.name}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      )}
    </QueryBoundary>
  );
}
