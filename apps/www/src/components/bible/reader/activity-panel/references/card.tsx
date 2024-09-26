import { vectorStore } from '@/ai/vector-store';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button, buttonVariants } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import { DrawerClose } from '@/www/components/ui/drawer';
import { Skeleton } from '@/www/components/ui/skeleton';
import { H6 } from '@/www/components/ui/typography';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { For } from 'solid-js';

const getReferences = async ({ text, bibleId }: { text: string; bibleId: string }) => {
  'use server';
  return await vectorStore.searchDocuments(text, {
    withMetadata: true,
    limit: 5,
    filter: `bibleId = "${bibleId}" or type != "bible"`, // Get references from the same bible OR non-bible references like commentaries
  });
};

export const ReferencesCard = () => {
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() => ({
    queryKey: ['references', { text: brStore.selectedText, bibleId: brStore.bible.id }],
    queryFn: () => getReferences({ text: brStore.selectedText, bibleId: brStore.bible.id }),
  }));

  return (
    <Card class='flex w-full flex-1 flex-col overflow-y-auto border-none bg-transparent'>
      <CardHeader>
        <CardTitle>References</CardTitle>
      </CardHeader>
      <CardContent class='flex w-full flex-1 flex-col overflow-y-auto'>
        <QueryBoundary
          query={query}
          loadingFallback={
            <div class='flex w-full flex-col items-center space-y-4 rounded-lg border p-5'>
              <For each={new Array(5)}>
                {(_, idx) => (
                  <div class='flex w-full space-x-2'>
                    <span class='font-bold'>{idx() + 1}.</span>
                    <div class='flex w-full flex-col space-y-2'>
                      <Skeleton height={16} radius={10} />
                      <Skeleton height={100} radius={10} />
                    </div>
                  </div>
                )}
              </For>
            </div>
          }
        >
          {(references) => (
            <div class='flex w-full flex-1 flex-col space-y-4 overflow-y-auto rounded-lg border p-5'>
              <For each={references}>
                {(reference, idx) => (
                  <div class='flex w-full flex-col items-start justify-start'>
                    <div class='flex w-full space-x-2'>
                      <span class='font-bold'>{idx() + 1}.</span>
                      <div class='flex w-full flex-col space-y-2'>
                        <H6>
                          {reference

                            .metadata!.name.replace(`(${brStore.bible.abbreviationLocal})`, '')

                            .trim()}
                          :
                        </H6>
                        <p class='line-clamp-3 truncate text-wrap'>
                          {reference.content.replace(`- ${reference.metadata!.name}`, '').trim()}
                        </p>
                      </div>
                    </div>
                    <DrawerClose
                      as={A}
                      href={`${reference.metadata!.url}?verseIds=${encodeURIComponent(reference.metadata!.verseIds.join(','))}`}
                      class={cn(buttonVariants({ variant: 'link' }), 'text-accent-foreground')}
                    >
                      Read More
                    </DrawerClose>
                  </div>
                )}
              </For>
            </div>
          )}
        </QueryBoundary>
      </CardContent>
      <CardFooter class='justify-end space-x-2'>
        <DrawerClose as={Button} variant='outline'>
          Close
        </DrawerClose>
      </CardFooter>
    </Card>
  );
};
