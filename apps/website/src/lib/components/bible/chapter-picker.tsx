'use client';

import { useRpcClient } from '@/hooks/use-rpc-client';
import type { Routes } from '@/types/rpc';
import { useQuery } from '@tanstack/react-query';
import type { InferResponseType } from 'hono/client';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import Spinner from '../ui/spinner';

export default function BookChapterPicker({
  bible,
  books,
  book,
  chapter
}: {
  bible: InferResponseType<Routes['bibles'][':id']['$get']>['data'];
  books: InferResponseType<Routes['bibles'][':id']['books']['$get']>['data'];
  book: InferResponseType<Routes['bibles'][':id']['books'][':bookId']['$get']>['data'];
  chapter: InferResponseType<Routes['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {book.shortName} {chapter.number}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search books..." />
          <CommandList>
            <CommandEmpty>Not Found</CommandEmpty>
            {books.map((foundBook) => (
              <ChapterPicker
                key={foundBook.id}
                bible={bible}
                book={foundBook}
                currentChapter={chapter}
              />
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ChapterPicker({
  bible,
  book,
  currentChapter
}: {
  bible: InferResponseType<Routes['bibles'][':id']['$get']>['data'];
  book: InferResponseType<Routes['bibles'][':id']['books'][':bookId']['$get']>['data'];
  currentChapter: InferResponseType<
    Routes['bibles'][':id']['chapters'][':chapterId']['$get']
  >['data'];
}) {
  const rpcClient = useRpcClient();
  const router = useRouter();

  const query = useQuery({
    queryKey: ['chapters', { bookId: book.id }],
    queryFn: async () => {
      const response = await rpcClient.bibles[':id'].books[':bookId'].chapters.$get({
        param: {
          id: bible.abbreviation,
          bookId: book.abbreviation
        },
        query: {
          limit: '150',
          sort: 'number:asc'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch chapters');
      }
      return await response.json();
    },
    enabled: false
  });

  return (
    <>
      <CommandItem value={book.shortName} className="aria-selected:bg-background">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value={book.abbreviation} onClick={() => !query.data && query.refetch()}>
            <AccordionTrigger>{book.shortName}</AccordionTrigger>
            <AccordionContent className="grid grid-cols-3 gap-1">
              {query.isLoading && <Spinner size="sm" className="col-span-3" />}
              {query.data?.data.map((foundChapter) => (
                <Button
                  key={foundChapter.id}
                  variant="outline"
                  onClick={() => {
                    router.push(
                      `/bible/${bible.abbreviation}/${book.abbreviation}/${foundChapter.number}`
                    );
                  }}
                  className="flex place-items-center justify-center overflow-visible"
                >
                  <Check
                    size={10}
                    className={`mr-1 h-4 w-4 flex-shrink-0 ${foundChapter.id === currentChapter.id ? '' : 'hidden'}`}
                  />
                  {foundChapter.number}
                </Button>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CommandItem>
    </>
  );
}
