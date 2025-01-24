import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { useDevotionStore } from '@/www/contexts/devotion';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import { Show } from 'solid-js';

const getLatestDevotion = GET(async () => {
  'use server';
  const devotion = await db.query.devotions.findFirst({
    orderBy: (devotions, { desc }) => desc(devotions.createdAt),
  });
  return { devotion: devotion ?? null };
});

const getLatestDevotionQueryOptions = () => ({
  queryKey: ['latest-devotion'],
  queryFn: () => getLatestDevotion(),
});

export const route: RouteDefinition = {
  preload: () => {
    const qc = useQueryClient();
    qc.prefetchQuery(getLatestDevotionQueryOptions());
  },
};

const DevotionPage = () => {
  const devotionQuery = createQuery(() => getLatestDevotionQueryOptions());
  const [devotionStore] = useDevotionStore();

  return (
    <Show
      when={!devotionStore.devotion}
      fallback={<Navigate href={`/devotion/${devotionStore.devotion!.id}`} />}
    >
      <QueryBoundary query={devotionQuery}>
        {({ devotion }) => (
          <Show
            when={devotion}
            fallback={
              <div class='flex h-full w-full items-center justify-center p-10'>
                Latest devotion not found
              </div>
            }
            keyed
          >
            {(devotion) => <Navigate href={`/devotion/${devotion.id}`} />}
          </Show>
        )}
      </QueryBoundary>
    </Show>
  );
};

export default DevotionPage;
