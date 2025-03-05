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

const getReferences = GET(
  async ({ text, bibleAbbreviation }: { text: string; bibleAbbreviation: string }) => {
    'use server';
    const {
      experimental_output: { terms },
    } = await generateText({
      model: registry.languageModel('openai:gpt-4o-mini'),
      experimental_output: Output.object({
        schema: z.object({
          terms: z
            .array(
              z.object({
                term: z.string().describe('The search term or phrase to search for.'),
                weight: z
                  .number()
                  .min(0)
                  .max(1)
                  .optional()
                  .default(1)
                  .describe('The weight of the search term between 0 and 1.'),
                category: z
                  .string()
                  .optional()
                  .describe(
                    'The category of resources to search for. "bible" will only search for resources from the Bible. "theology" will only search for popular theology resources such as commentaries, sermons, and theological books. "general" will search for resources from all types. The default is "general".',
                  ),
              }),
            )
            .min(1)
            .max(4)
            .describe(
              'A list of 1 to 4 search terms, their weights, and their category. The search terms are searched separately and should not rely on each other.',
            ),
        }),
      }),
      prompt: `You are an expert in the bible. You will be given a passage and asked to find references to it in the bible. Return a list of search terms or phrases that could be used to find references to this verse in a vector similarity search engine. 

Here are some rules for you to follow:
- The search terms can include text from the verse itself, or a paraphrase of the verse.
- The search terms can be single words or a whole sentence.

Here is the passage:
${text}`,
    });
    const results = await Promise.all(
      terms.map(({ term, weight, category }) => {
        let filter = `bibleAbbreviation = "${bibleAbbreviation}" or (type != "bible" and type != "BIBLE")`;
        if (category === 'bible') {
          filter = `(type = "bible" or type = "BIBLE") and bibleAbbreviation = "${bibleAbbreviation}"`;
        } else if (category === 'theology') {
          filter = 'category = "theology"';
        }
        return vectorStore
          .searchDocuments(term, {
            withMetadata: true,
            withEmbedding: false,
            limit: 12,
            filter,
          })
          .then((docs) =>
            docs.map((doc) => ({
              ...doc,
              score: doc.score * weight,
            })),
          );
      }),
    ).then((results) =>
      results
        .flat()
        .filter((result, idx, self) => self.findIndex((t) => t.id === result.id) === idx) // Remove duplicates
        .toSorted((a, b) => b.score - a.score),
    );

    return { references: results.slice(0, 12) };
  },
);

export const ReferencesCard = () => {
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() => ({
    queryKey: [
      'references',
      { text: brStore.selectedText, bibleAbbreviation: brStore.bible.abbreviation },
    ],
    queryFn: () =>
      getReferences({ text: brStore.selectedText, bibleAbbreviation: brStore.bible.abbreviation }),
    staleTime: Number.POSITIVE_INFINITY,
  }));

  return (
    <Card className='flex w-full flex-1 flex-col overflow-y-auto border-none bg-transparent'>
      <CardHeader>
        <CardTitle>References</CardTitle>
      </CardHeader>
      <CardContent className='flex w-full flex-1 flex-col overflow-y-auto'>
        <QueryBoundary
          query={query}
          loadingFallback={
            <div className='flex w-full flex-col items-center space-y-4 rounded-lg border p-5'>
              <For each={new Array(5)}>
                {(_, idx) => (
                  <div className='flex w-full space-x-2'>
                    <span className='font-bold'>{idx() + 1}.</span>
                    <div className='flex w-full flex-col space-y-2'>
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
            <div className='flex w-full flex-1 flex-col space-y-4 overflow-y-auto rounded-lg border p-5'>
              <For each={references}>
                {(reference, idx) => (
                  <div className='flex w-full flex-col items-start justify-start'>
                    <div className='flex w-full space-x-2'>
                      <span className='font-bold'>{idx() + 1}.</span>
                      <div className='flex w-full flex-col space-y-2'>
                        <H6>
                          {reference
                            .metadata!.name.replace(`(${brStore.bible.abbreviationLocal})`, '')
                            .trim()}
                          :
                        </H6>
                        <p className='line-clamp-5 truncate text-wrap'>
                          {reference.content.replace(`- ${reference.metadata!.name}`, '').trim()}
                        </p>
                      </div>
                    </div>
                    <DrawerClose
                      as={A}
                      href={`${reference.metadata!.url}?${
                        reference
                          .metadata!.verseNumbers?.map(
                            (verseNumber: string) =>
                              `verseNumber=${encodeURIComponent(verseNumber)}`,
                          )
                          .join('&') ?? ''
                      }`}
                      className={cn(buttonVariants({ variant: 'link' }), 'text-accent-foreground')}
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
      <CardFooter className='justify-end space-x-2'>
        <DrawerClose as={Button} variant='outline'>
          Close
        </DrawerClose>
      </CardFooter>
    </Card>
  );
};
