import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { getDocumentVectorStore } from '@theaistudybible/langchain/lib/vector-db';
import { For } from 'solid-js';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { QueryBoundary } from '~/components/query-boundary';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { DrawerClose } from '~/components/ui/drawer';
import { Skeleton } from '~/components/ui/skeleton';
import { H6 } from '~/components/ui/typography';

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
            <div class="flex flex-col space-y-4 rounded-lg border p-5">
              <For each={new Array(5)}>
                {(_, idx) => (
                  <div class="flex space-x-2">
                    <span class="font-bold">{idx() + 1}.</span>
                    <Skeleton height={16} width={400} radius={10} />
                  </div>
                )}
              </For>
            </div>
          }
        >
          {(references) => (
            <div class="flex flex-1 flex-col space-y-4 overflow-y-auto rounded-lg border p-5">
              <For each={references}>
                {(reference, idx) => (
                  <A class="flex space-x-2" href={reference.metadata.url}>
                    <span class="font-bold">{idx() + 1}.</span>
                    <div class="flex flex-col space-y-2">
                      <H6>From {reference.metadata.name}:</H6>
                      <p class="max-h-32 overflow-y-auto rounded-lg border border-border px-3 py-1">
                        {reference.pageContent.split('---')[1]}
                      </p>
                    </div>
                  </A>
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
