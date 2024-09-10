import { db } from '@/core/database';
import { toTitleCase } from '@/core/utils/string';
import { QueryBoundary } from '@/www/components/query-boundary';
import { H1, H3 } from '@/www/components/ui/typography';
import { useDevotionStore } from '@/www/contexts/devotion';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import { createEffect, Show } from 'solid-js';

const getDevotion = async (props: { id: string }) => {
  'use server';
  const devotion = await db.query.devotions.findFirst({
    where: (devotions, { eq }) => eq(devotions.id, props.id),
    with: {
      images: true,
    },
  });

  return devotion ?? null;
};

const getDevotionQueryProps = (id: string) => {
  return {
    queryKey: ['devotion', { id }],
    queryFn: () => getDevotion({ id }),
  };
};

export const route: RouteDefinition = {
  preload: async ({ params }) => {
    const { id } = params;
    const qc = useQueryClient();
    await qc.prefetchQuery(getDevotionQueryProps(id));
  },
};

const DevotionPage = () => {
  const params = useParams();
  const [, setDevotionStore] = useDevotionStore();

  const devotionQuery = createQuery(() => getDevotionQueryProps(params.id));
  createEffect(() => {
    setDevotionStore('devotion', devotionQuery.data ?? undefined);
  });

  return (
    <QueryBoundary query={devotionQuery}>
      {(devotion) => (
        <div class="flex w-full grow flex-col items-center p-5">
          <div class="flex w-full max-w-2xl flex-col gap-4 whitespace-pre-wrap">
            <H1 class="from-primary to-accent-foreground dark:from-accent-foreground dark:to-secondary-foreground inline-block bg-gradient-to-r bg-clip-text text-center text-transparent">
              {toTitleCase(devotion.topic)}
            </H1>
            <div class="flex flex-col gap-2 text-center">
              <H3 class="from-primary to-accent-foreground dark:from-accent-foreground dark:to-secondary-foreground inline-block bg-gradient-to-r bg-clip-text text-transparent">
                Reading
              </H3>
              <p>{devotion.bibleReading}</p>
            </div>
            <div class="flex flex-col gap-2">
              <H3 class="from-primary to-accent-foreground dark:from-accent-foreground dark:to-secondary-foreground inline-block bg-gradient-to-r bg-clip-text text-center text-transparent">
                Summary
              </H3>
              <p>{devotion.summary}</p>
            </div>
            <div class="flex flex-col gap-2">
              <H3 class="from-primary to-accent-foreground dark:from-accent-foreground dark:to-secondary-foreground inline-block bg-gradient-to-r bg-clip-text text-center text-transparent">
                Reflection
              </H3>
              <p>{devotion.reflection}</p>
            </div>
            <div class="flex flex-col gap-2">
              <H3 class="from-primary to-accent-foreground dark:from-accent-foreground dark:to-secondary-foreground inline-block bg-gradient-to-r bg-clip-text text-center text-transparent">
                Prayer
              </H3>
              <p>{devotion.prayer}</p>
            </div>
            <Show when={devotion.images} keyed>
              {(image) => (
                <div class="flex flex-col gap-2">
                  <H3 class="from-primary to-accent-foreground dark:from-accent-foreground dark:to-secondary-foreground inline-block bg-gradient-to-r bg-clip-text text-center text-transparent">
                    Image
                  </H3>
                  <img src={image.url!} alt="Devotion image" />
                  <p class="text-xs">Prompt: {image.prompt}</p>
                </div>
              )}
            </Show>
          </div>
        </div>
      )}
    </QueryBoundary>
  );
};

export default DevotionPage;
