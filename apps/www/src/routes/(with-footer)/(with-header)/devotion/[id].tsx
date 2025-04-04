import { db } from '@/core/database';
import { toTitleCase } from '@/core/utils/string';
import { DevotionMenu } from '@/www/components/devotions/menu';
import { DevotionSidebar, getDevotionsQueryOptions } from '@/www/components/devotions/sidebar';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Markdown } from '@/www/components/ui/markdown';
import { SidebarProvider } from '@/www/components/ui/sidebar';
import { H2, H3 } from '@/www/components/ui/typography';
import { useDevotionStore } from '@/www/contexts/devotion';
import { useWindowSize } from '@solid-primitives/resize-observer';
import { Meta, Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { A, useParams } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import { For, Show, createEffect, createMemo } from 'solid-js';

const getDevotion = GET(async ({ id }: { id: string }) => {
  'use server';
  const devotion = await db.query.devotions.findFirst({
    where: (devotions, { eq }) => eq(devotions.id, id),
    with: { images: true },
  });
  return { devotion: devotion ?? null };
});

const getDevotionQueryProps = ({ id }: { id: string }) => ({
  queryKey: ['devotion', { id }],
  queryFn: () => getDevotion({ id }),
  staleTime: 1000 * 60 * 60, // 1 hour
});

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { id } = params;
    const qc = useQueryClient();
    Promise.all([
      qc.prefetchInfiniteQuery(getDevotionsQueryOptions()),
      qc.prefetchQuery(getDevotionQueryProps({ id })),
    ]);
  },
};

export default function DevotionPage() {
  const params = useParams();
  const windowSize = useWindowSize();
  const [, setDevotionStore] = useDevotionStore();

  const devotionQuery = createQuery(() => ({
    ...getDevotionQueryProps({ id: params.id }),
  }));
  createEffect(() => {
    if (devotionQuery.status === 'success') {
      setDevotionStore('devotion', devotionQuery.data.devotion);
    }
  });

  const isMobile = createMemo(() => windowSize.width < 768);

  return (
    <SidebarProvider
      class='min-h-full flex-1 overflow-hidden'
      style={{
        '--sidebar-width': '20rem',
      }}
      defaultOpen={!isMobile()}
    >
      <DevotionSidebar />
      <div class='flex w-full flex-1 flex-col overflow-hidden'>
        <div class='flex w-full flex-1 flex-col overflow-y-auto'>
          <DevotionMenu />
          <QueryBoundary query={devotionQuery}>
            {({ devotion }) => (
              <Show
                when={devotion}
                fallback={
                  <div class='flex w-full flex-1 flex-col items-center justify-center gap-4'>
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
                    <div class='flex w-full flex-1 flex-col'>
                      <div class='mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 whitespace-pre-wrap px-5 pt-10 pb-20'>
                        <Show when={devotion.images} keyed>
                          {(image) => (
                            <img
                              src={image.url!}
                              class='h-auto w-full rounded-lg shadow-sm'
                              alt='Illustration for the devotion'
                            />
                          )}
                        </Show>
                        <div class='flex flex-col gap-2 text-center'>
                          <H2 class='inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
                            Reading
                          </H2>
                          <Markdown>{devotion.bibleReading}</Markdown>
                        </div>
                        <div class='flex flex-col gap-2'>
                          <H2 class='inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
                            Summary
                          </H2>
                          <Markdown>{devotion.summary}</Markdown>
                        </div>
                        <Show when={devotion.reflection} keyed>
                          {(reflection) => (
                            <div class='flex flex-col gap-2'>
                              <H2 class='inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
                                Reflection
                              </H2>
                              <Markdown>{reflection}</Markdown>
                            </div>
                          )}
                        </Show>
                        <Show when={devotion.prayer} keyed>
                          {(prayer) => (
                            <div class='flex flex-col gap-2'>
                              <H2 class='inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
                                Prayer
                              </H2>
                              <Markdown>{prayer}</Markdown>
                            </div>
                          )}
                        </Show>
                        <Show when={devotion.diveDeeperQueries} keyed>
                          {(queries) => (
                            <div class='flex flex-col gap-2'>
                              <H2 class='inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
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
                    </div>
                  </>
                )}
              </Show>
            )}
          </QueryBoundary>
        </div>
      </div>
    </SidebarProvider>
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
