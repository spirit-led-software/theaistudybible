import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { getDocumentVectorStore } from '@theaistudybible/langchain/lib/vector-db';
import { For } from 'solid-js';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { QueryBoundary } from '~/components/query-boundary';
import { Button, buttonVariants } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { DrawerClose } from '~/components/ui/drawer';
import { Skeleton } from '~/components/ui/skeleton';
import { H6 } from '~/components/ui/typography';
import { cn } from '~/lib/utils';

const getReferences = async (text: string) => {
  'use server';
  const vectorStore = await getDocumentVectorStore();
  const docs = await vectorStore.similaritySearch(text, 5);
  return docs.map((doc) => ({
    pageContent: doc.pageContent,
    metadata: doc.metadata
  }));
};

export const ReferencesCard = () => {
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() => ({
    queryKey: ['references', { text: brStore.selectedText }],
    queryFn: () => getReferences(brStore.selectedText)
  }));

  return (
    <Card class="flex w-full flex-1 flex-col overflow-y-auto border-none bg-transparent">
      <CardHeader>
        <CardTitle>References</CardTitle>
      </CardHeader>
      <CardContent class="flex w-full flex-1 flex-col overflow-y-auto">
        <QueryBoundary
          query={query}
          loadingFallback={
            <div class="flex w-full flex-col items-center space-y-4 rounded-lg border p-5">
              <For each={new Array(5)}>
                {(_, idx) => (
                  <div class="flex w-full space-x-2">
                    <span class="font-bold">{idx() + 1}.</span>
                    <div class="flex w-full flex-col space-y-2">
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
            <div class="flex w-full flex-1 flex-col space-y-4 overflow-y-auto rounded-lg border p-5">
              <For each={references}>
                {(reference, idx) => (
                  <div class="flex w-full flex-col items-start justify-start">
                    <div class="flex w-full space-x-2">
                      <span class="font-bold">{idx() + 1}.</span>
                      <div class="flex w-full flex-col space-y-2">
                        <H6>
                          {reference.metadata.name
                            .replace(`(${brStore.bible.abbreviationLocal})`, '')
                            .trim()}
                          :
                        </H6>
                        <p class="line-clamp-3 truncate text-wrap">
                          {reference.pageContent.replace(`- ${reference.metadata.name}`, '').trim()}
                        </p>
                      </div>
                    </div>
                    <DrawerClose
                      as={A}
                      href={`${reference.metadata.url}?verseIds=${encodeURIComponent(reference.metadata.verseIds.join(','))}`}
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
      <CardFooter class="justify-end space-x-2">
        <DrawerClose as={Button} variant="outline">
          Close
        </DrawerClose>
      </CardFooter>
    </Card>
  );
};
