import { RouteDefinition, useParams } from '@solidjs/router';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { toTitleCase } from '@theaistudybible/core/util/string';
import { createEffect, Show } from 'solid-js';
import { QueryBoundary } from '~/components/query-boundary';
import { H1, H3 } from '~/components/ui/typography';
import { useDevotionStore } from '~/contexts/devotion';

const getDevotion = async (props: { id: string }) => {
  'use server';
  const devotion = await db.query.devotions.findFirst({
    where: (devotions, { eq }) => eq(devotions.id, props.id),
    with: {
      images: true
    }
  });

  return devotion ?? null;
};

const getDevotionQueryProps = (id: string) => {
  return {
    queryKey: ['devotion', { id }],
    queryFn: () => getDevotion({ id })
  };
};

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { id } = params;
    const qc = useQueryClient();
    qc.prefetchQuery(getDevotionQueryProps(id));
  }
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
            <H1 class="inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
              {toTitleCase(devotion.topic)}
            </H1>
            <div class="flex flex-col gap-2 text-center">
              <H3 class="inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
                Reading
              </H3>
              <p>{devotion.bibleReading}</p>
            </div>
            <div class="flex flex-col gap-2">
              <H3 class="inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
                Summary
              </H3>
              <p>{devotion.summary}</p>
            </div>
            <div class="flex flex-col gap-2">
              <H3 class="inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
                Reflection
              </H3>
              <p>{devotion.reflection}</p>
            </div>
            <div class="flex flex-col gap-2">
              <H3 class="inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
                Prayer
              </H3>
              <p>{devotion.prayer}</p>
            </div>
            <Show when={devotion.images} keyed>
              {(image) => (
                <div class="flex flex-col gap-2">
                  <H3 class="inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
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
