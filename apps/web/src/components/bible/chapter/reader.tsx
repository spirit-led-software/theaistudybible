import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { ChevronLeft, ChevronRight } from 'lucide-solid';
import { Accessor, Show, createEffect } from 'solid-js';
import { useBibleStore } from '~/components/providers/bible';
import { BibleReaderProvider } from '~/components/providers/bible-reader';
import { QueryBoundary } from '~/components/query-boundary';
import { H1 } from '~/components/ui/typography';
import { cn } from '~/lib/utils';
import { buttonVariants } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { ReaderContent } from '../reader';
import { BibleReaderMenu } from '../reader/menu';
import { getChapterReaderData } from './server';

export type ChapterReaderProps = {
  bibleAbbr: Accessor<string>;
  bookAbbr: Accessor<string>;
  chapterNum: Accessor<number>;
};

export const chapterReaderQueryOptions = (props: {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
}) => ({
  queryKey: ['chapter-reader', props],
  queryFn: () => getChapterReaderData(props)
});

export default function ChapterReader(props: ChapterReaderProps) {
  const query = createQuery(() =>
    chapterReaderQueryOptions({
      bibleAbbr: props.bibleAbbr(),
      bookAbbr: props.bookAbbr(),
      chapterNum: props.chapterNum()
    })
  );

  const [, setBibleStore] = useBibleStore();
  createEffect(() => {
    if (query.data) {
      setBibleStore('bible', query.data.bible);
      setBibleStore('book', query.data.book);
      setBibleStore('chapter', query.data.chapter);
      setBibleStore('verse', undefined);
    }
  });

  return (
    <QueryBoundary query={query}>
      {(data) => (
        <BibleReaderProvider bible={data.bible} book={data.book} chapter={data.chapter}>
          <BibleReaderMenu />
          <div class="mt-10">
            <div class="flex w-full justify-center">
              <H1 class="inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
                {data.chapter.name}
              </H1>
            </div>
            <Show when={props.chapterNum} keyed>
              <ReaderContent contents={data.chapter.content} />
            </Show>
            <Show when={data.chapter.previous}>
              <div class="fixed bottom-1/3 left-0 top-1/3 flex flex-col place-items-center justify-center">
                <Tooltip placement="right">
                  <TooltipTrigger
                    as={A}
                    class={cn(buttonVariants(), 'my-auto h-20 w-10 rounded-r-2xl')}
                    href={`/bible/${data.bible.abbreviation}/${data.chapter.previous!.abbreviation.split('.')[0]}/${data.chapter.previous!.number}`}
                  >
                    <ChevronLeft size={20} class="shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{data.chapter.previous!.name}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </Show>
            <Show when={data.chapter.next}>
              <div class="fixed bottom-1/3 right-0 top-1/3 flex flex-col place-items-center justify-center">
                <Tooltip placement="left">
                  <TooltipTrigger
                    as={A}
                    class={cn(buttonVariants(), 'my-auto h-20 w-10 rounded-l-2xl')}
                    href={`/bible/${data.bible.abbreviation}/${data.chapter.next!.abbreviation.split('.')[0]}/${data.chapter.next!.number}`}
                  >
                    <ChevronRight size={20} class="shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{data.chapter.next!.name}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </Show>
          </div>
        </BibleReaderProvider>
      )}
    </QueryBoundary>
  );
}
