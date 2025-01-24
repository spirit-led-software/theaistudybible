import { registry } from '@/ai/provider-registry';
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
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { Output, generateText } from 'ai';
import { For } from 'solid-js';
import { z } from 'zod';

const getReferences = GET(async ({ text, bibleId }: { text: string; bibleId: string }) => {
  'use server';
  const {
    experimental_output: { searchTerms },
  } = await generateText({
    model: registry.languageModel('openai:gpt-4o-mini'),
    experimental_output: Output.object({ schema: z.object({ searchTerms: z.array(z.string()) }) }),
    prompt: `You are an expert in the bible. You will be given a passage and asked to find references to it in the bible. Return a list of search terms or phrases that could be used to find references to this verse in a vector similarity search engine. 

Here are some rules for you to follow:
- The search terms can include text from the verse itself, or a paraphrase of the verse.
- The search terms can be single words or a whole sentence.

Here is the passage:
${text}`,
  });
  const maxDocs = 10;
  const results = await Promise.all(
    searchTerms.map((searchTerm) =>
      vectorStore.searchDocuments(searchTerm, {
        withMetadata: true,
        withEmbedding: false,
        limit: Math.ceil(maxDocs / searchTerms.length),
        filter: `bibleId = "${bibleId}" or type != "bible"`, // Get references from the same bible OR non-bible references like commentaries
      }),
    ),
  ).then((results) =>
    results.flat().filter(
      (result, idx, self) => self.findIndex((t) => t.id === result.id) === idx, // Remove duplicates
    ),
  );

  return { references: results };
});

export const ReferencesCard = () => {
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() => ({
    queryKey: ['references', { text: brStore.selectedText, bibleId: brStore.bible.id }],
    queryFn: () => getReferences({ text: brStore.selectedText, bibleId: brStore.bible.id }),
    staleTime: Number.POSITIVE_INFINITY,
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
                      <Skeleton height={24} radius={10} />
                      <Skeleton height={120} radius={10} />
                    </div>
                  </div>
                )}
              </For>
            </div>
          }
        >
          {({ references }) => (
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
                        <p class='line-clamp-5 truncate text-wrap'>
                          {reference.content.replace(`- ${reference.metadata!.name}`, '').trim()}
                        </p>
                      </div>
                    </div>
                    <DrawerClose
                      as={A}
                      href={`${reference.metadata!.url}?${
                        reference
                          .metadata!.verseIds?.map(
                            (verseId: string) => `verseId=${encodeURIComponent(verseId)}`,
                          )
                          .join('&') ?? ''
                      }`}
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
