import { db } from '@/core/database';
import type { Book } from '@/schemas/bibles/types';
import { QueryBoundary } from '@/www/components/query-boundary';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/www/components/ui/accordion';
import { Button } from '@/www/components/ui/button';
import { CommandItem } from '@/www/components/ui/command';
import { Skeleton } from '@/www/components/ui/skeleton';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Check } from 'lucide-react';
import { z } from 'zod';

const getChapterPickerData = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      bibleAbbreviation: z.string(),
      bookCode: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const bibleData = await db.query.bibles.findFirst({
      where: (bibles, { and, eq }) =>
        and(eq(bibles.abbreviation, data.bibleAbbreviation), eq(bibles.readyForPublication, true)),
      columns: { abbreviation: true },
      with: {
        books: {
          limit: 1,
          where: (books, { eq }) => eq(books.code, data.bookCode),
          columns: { code: true },
          with: {
            chapters: {
              orderBy: (chapters, { asc }) => asc(chapters.number),
              columns: { code: true, number: true },
            },
          },
        },
      },
    });

    if (!bibleData) {
      throw new Error('Bible not found');
    }

    const { books, ...bible } = bibleData;
    if (!books[0]) {
      throw new Error('Book not found');
    }

    const { chapters, ...book } = books[0];

    return { bible, book, chapters };
  });

export const chapterPickerQueryOptions = (input: {
  bibleAbbreviation: string;
  bookCode: string;
}) => ({
  queryKey: ['chapter-picker', input],
  queryFn: () => getChapterPickerData({ data: input }),
  staleTime: 1000 * 60 * 60, // 1 hour
});

export type ChapterPickerProps = {
  book: Pick<Book, 'code' | 'shortName'>;
};

export function ChapterPicker(props: ChapterPickerProps) {
  const brStore = useBibleReaderStore((s) => ({
    bible: s.bible,
    chapter: s.chapter,
    verse: s.verse,
  }));

  const query = useQuery(
    chapterPickerQueryOptions({
      bibleAbbreviation: brStore.bible.abbreviation,
      bookCode: props.book.code,
    }),
  );

  return (
    <CommandItem value={props.book.shortName} className='aria-selected:bg-background'>
      <Accordion type='single' collapsible className='w-full'>
        <AccordionItem value={props.book.code}>
          <AccordionTrigger>{props.book.shortName}</AccordionTrigger>
          <AccordionContent className='grid grid-cols-4 gap-1'>
            <QueryBoundary
              query={query}
              loadingFallback={Array(24).map((_, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Fine here
                <Skeleton key={idx} className='h-full w-full rounded-lg' />
              ))}
              render={({ book, chapters }) =>
                chapters.map((foundChapter, idx) => (
                  <Button
                    key={foundChapter.code}
                    asChild
                    data-index={idx}
                    variant='outline'
                    className='flex place-items-center justify-center overflow-visible'
                  >
                    <Link
                      to='/bible/$bibleAbbreviation/$bookCode/$chapterNumber'
                      params={{
                        bibleAbbreviation: brStore.bible.abbreviation,
                        bookCode: book.code,
                        chapterNumber: foundChapter.number,
                      }}
                    >
                      <Check
                        size={10}
                        className={cn(
                          'mr-1 h-4 w-4 shrink-0',
                          foundChapter.code !== brStore.chapter.code && 'hidden',
                        )}
                      />
                      {foundChapter.number}
                    </Link>
                  </Button>
                ))
              }
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CommandItem>
  );
}
