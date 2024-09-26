import { db } from '@/core/database';
import { toTitleCase } from '@/core/utils/string';
import { DevotionMenu } from '@/www/components/devotions/menu';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Markdown } from '@/www/components/ui/markdown';
import { H2 } from '@/www/components/ui/typography';
import { useDevotionStore } from '@/www/contexts/devotion';
import { WithHeaderLayout } from '@/www/layouts/with-header';
import { Meta, Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import { Show, createEffect } from 'solid-js';

const getDevotion = async ({ id }: { id: string }) => {
  'use server';
  const devotion = await db.query.devotions.findFirst({
    where: (devotions, { eq }) => eq(devotions.id, id),
    with: { images: true },
  });

  return devotion ?? null;
};

const getDevotionQueryProps = ({ id }: { id: string }) => ({
  queryKey: ['devotion', { id }],
  queryFn: () => getDevotion({ id }),
});

export const route: RouteDefinition = {
  preload: async ({ params }) => {
    const { id } = params;
    const qc = useQueryClient();
    await qc.prefetchQuery(getDevotionQueryProps({ id }));
  },
};

const DevotionPage = () => {
  const params = useParams();
  const [, setDevotionStore] = useDevotionStore();

  const devotionQuery = createQuery(() => ({
    ...getDevotionQueryProps({ id: params.id }),
  }));
  createEffect(() => {
    if (!devotionQuery.isLoading && devotionQuery.data) {
      setDevotionStore('devotion', devotionQuery.data);
    }
  });

  return (
    <WithHeaderLayout>
      <div class='relative flex h-full w-full flex-1 flex-col overflow-hidden'>
        <DevotionMenu />
        <div class='flex h-full w-full flex-1 flex-col items-center overflow-y-auto p-5 pt-32 pb-20'>
          <QueryBoundary query={devotionQuery}>
            {(devotion) => (
              <>
                <Title>{toTitleCase(devotion.topic)} | Devotion | The AI Study Bible</Title>
                <Meta
                  name='description'
                  content={`A devotion on '${toTitleCase(devotion.topic)}' from The AI Study Bible`}
                />
                <div class='flex w-full max-w-2xl flex-col gap-4 whitespace-pre-wrap'>
                  <div class='flex flex-col gap-2 text-center'>
                    <H2 class='inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
                      Reading
                    </H2>
                    <p>{devotion.bibleReading}</p>
                  </div>
                  <div class='flex flex-col gap-2'>
                    <H2 class='inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
                      Summary
                    </H2>
                    <Markdown>{devotion.summary}</Markdown>
                  </div>
                  <Show when={devotion.reflection} keyed>
                    {(reflection) => (
                      <div class='flex flex-col gap-2'>
                        <H2 class='inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
                          Reflection
                        </H2>
                        <Markdown>{reflection}</Markdown>
                      </div>
                    )}
                  </Show>
                  <Show when={devotion.prayer} keyed>
                    {(prayer) => (
                      <div class='flex flex-col gap-2'>
                        <H2 class='inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
                          Prayer
                        </H2>
                        <Markdown>{prayer}</Markdown>
                      </div>
                    )}
                  </Show>
                  <Show when={devotion.images} keyed>
                    {(image) => (
                      <div class='flex flex-col gap-2'>
                        <H2 class='inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
                          Generated Illustration
                        </H2>
                        <img src={image.url!} alt='Illustration for the devotion' />
                        <p class='text-xs'>Prompt: {image.prompt}</p>
                      </div>
                    )}
                  </Show>
                </div>
              </>
            )}
          </QueryBoundary>
        </div>
      </div>
    </WithHeaderLayout>
  );
};

export default DevotionPage;
