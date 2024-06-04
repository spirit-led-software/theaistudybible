import { useNavigate } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import type { InferResponseType } from 'hono/client';
import { Check, ChevronsUpDown } from 'lucide-solid';
import { createSignal } from 'solid-js';
import { useRpcClient } from '~/hooks/rpc';
import type { RpcClient } from '~/types/rpc';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Spinner } from '../ui/spinner';

export default function BookChapterPicker({
  bible,
  books,
  book,
  chapter
}: {
  bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
  books: InferResponseType<RpcClient['bibles'][':id']['books']['$get']>['data'];
  book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
  chapter: InferResponseType<RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
}) {
  const [open, setOpen] = createSignal(false);

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <PopoverTrigger
        as={() => (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open()}
            class="w-[200px] justify-between"
          >
            {book.shortName} {chapter.number}
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        )}
      />
      <PopoverContent class="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search books..." />
          <CommandList>
            <CommandEmpty>Not Found</CommandEmpty>
            {books.map((foundBook) => (
              <ChapterPicker bible={bible} book={foundBook} currentChapter={chapter} />
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
  bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
  book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
  currentChapter: InferResponseType<
    RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']
  >['data'];
}) {
  const rpcClient = useRpcClient();
  const navigate = useNavigate();

  const query = createQuery(() => ({
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
      return (await response.json()).data;
    },
    enabled: false
  }));

  return (
    <>
      <CommandItem value={book.shortName} class="aria-selected:bg-background">
        <Accordion collapsible class="w-full">
          <AccordionItem value={book.abbreviation} onClick={() => !query.data && query.refetch()}>
            <AccordionTrigger>{book.shortName}</AccordionTrigger>
            <AccordionContent class="grid grid-cols-3 gap-1">
              {query.isLoading && <Spinner size="sm" class="col-span-3" />}
              {query.data?.map((foundChapter) => (
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate(
                      `/bible/${bible.abbreviation}/${book.abbreviation}/${foundChapter.number}`
                    );
                  }}
                  class="flex place-items-center justify-center overflow-visible"
                >
                  <Check
                    size={10}
                    class={`mr-1 h-4 w-4 flex-shrink-0 ${foundChapter.id === currentChapter.id ? '' : 'hidden'}`}
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
