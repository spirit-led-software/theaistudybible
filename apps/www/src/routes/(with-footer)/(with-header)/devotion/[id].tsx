import { db } from '@/core/database';
import { toTitleCase } from '@/core/utils/string';
import { DevotionMenu } from '@/www/components/devotions/menu';
import { getDevotionsQueryOptions } from '@/www/components/devotions/sidebar';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Markdown } from '@/www/components/ui/markdown';
import { H2, H3 } from '@/www/components/ui/typography';
import { useDevotionStore } from '@/www/contexts/devotion';
import { Meta, Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { A, json, query, useParams } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import { For, Show, createEffect, createMemo } from 'solid-js';

const getDevotion = query(async (id: string) => {
  'use server';
  const devotion = await db.query.devotions.findFirst({
    where: (devotions, { eq }) => eq(devotions.id, id),
    with: { images: true },
  });
  return { devotion: devotion ?? null };
}, 'devotion');

const getDevotionRequest = GET(async (id: string) => {
  const data = await getDevotion(id);
  return json(data, {
    headers: {
      'Cache-Control': 'public,max-age=86400,s-maxage=604800,stale-while-revalidate=86400',
    },
    revalidate: getDevotion.keyFor(id),
  });
});

const getDevotionQueryProps = (id: string) => ({
  queryKey: ['devotion', id],
  queryFn: async () => {
    const response = await getDevotionRequest(id);
    return (await response.json()) as Awaited<ReturnType<typeof getDevotion>>;
  },
  staleTime: 1000 * 60 * 60, // 1 hour
});

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { id } = params;
    const qc = useQueryClient();
    Promise.all([
      qc.prefetchInfiniteQuery(getDevotionsQueryOptions()),
      qc.prefetchQuery(getDevotionQueryProps(id)),
    ]);
  },
};

export default function DevotionPage() {
  const params = useParams();
  const [, setDevotionStore] = useDevotionStore();

  const devotionQuery = createQuery(() => getDevotionQueryProps(params.id));
  createEffect(() => {
    if (devotionQuery.status === 'success') {
      setDevotionStore('devotion', devotionQuery.data.devotion);
    }
  });

  return (
    <div class='relative flex h-full w-full flex-1 flex-col overflow-hidden'>
      <DevotionMenu />
      <div class='flex h-full w-full flex-1 flex-col items-center overflow-y-auto p-5 pt-32 pb-20'>
        <QueryBoundary query={devotionQuery}>
          {({ devotion }) => (
            <Show
              when={devotion}
              fallback={
                <div class='flex h-full w-full flex-1 flex-col items-center justify-center gap-4'>
                  <H3>Devotion not found</H3>
                  <Button as={A} href='/devotion'>
                    Go back to Devotions
                  </Button>
                </div>
              }
              keyed
            >
              {(devotion) => (
                <>
                  <MetaTags devotion={devotion} />
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
                    <Show when={devotion.diveDeeperQueries} keyed>
                      {(queries) => (
                        <div class='flex flex-col gap-2'>
                          <H2 class='inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
                            Dive Deeper
                          </H2>
                          <div class='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                            <For each={queries}>
                              {(query) => (
                                <Button
                                  as={A}
                                  href={`/chat?query=${encodeURIComponent(query)}`}
                                  variant='outline'
                                  class='h-auto w-full whitespace-normal py-3 text-left'
                                >
                                  {query}
                                </Button>
                              )}
                            </For>
                          </div>
                        </div>
                      )}
                    </Show>
                  </div>
                </>
              )}
            </Show>
          )}
        </QueryBoundary>
      </div>
    </div>
  );
}

const MetaTags = (props: {
  devotion: NonNullable<Awaited<ReturnType<typeof getDevotion>>['devotion']>;
}) => {
  const topic = createMemo(() => toTitleCase(props.devotion.topic));
  const title = createMemo(() => `${topic()} - Daily Bible Devotional | The AI Study Bible`);
  const description = createMemo(
    () =>
      `Explore our daily devotional on ${topic()}. Find spiritual insights, biblical wisdom, and guided prayer for deeper faith and understanding with The AI Study Bible.`,
  );
  const keywords = createMemo(
    () =>
      `bible devotional, ${topic().toLowerCase()}, daily devotion, bible study, spiritual growth, christian meditation, prayer, biblical wisdom, AI bible study`,
  );

  return (
    <>
      <Title>{title()}</Title>
      <Meta name='description' content={description()} />
      <Meta name='keywords' content={keywords()} />
      <Meta property='og:title' content={title()} />
      <Meta property='og:description' content={description()} />
      <Meta property='og:type' content='article' />
      <Meta name='twitter:card' content='summary' />
      <Meta name='twitter:title' content={title()} />
      <Meta name='twitter:description' content={description()} />
    </>
  );
};
