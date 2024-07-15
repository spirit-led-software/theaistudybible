import { Navigate, RouteDefinition } from '@solidjs/router';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { QueryBoundary } from '~/components/query-boundary';
import { useDevotionStore } from '~/contexts/devotion';

const getLatestDevotion = async () => {
  'use server';
  const devotion = await db.query.devotions.findFirst({
    orderBy: (devotions, { desc }) => desc(devotions.createdAt)
  });

  return devotion ?? null;
};

const getLatestDevotionQueryOptions = {
  queryKey: ['latest-devotion'],
  queryFn: getLatestDevotion
};

export const route: RouteDefinition = {
  preload: () => {
    const qc = useQueryClient();
    qc.prefetchQuery(getLatestDevotionQueryOptions);
  }
};

const DevotionPage = () => {
  const devotionQuery = createQuery(() => getLatestDevotionQueryOptions);
  const [devotionStore] = useDevotionStore();

  if (devotionStore.devotion) {
    return <Navigate href={`/devotion/${devotionStore.devotion.id}`} />;
  }

  return (
    <QueryBoundary query={devotionQuery}>
      {(devotion) => <Navigate href={`/devotion/${devotion.id}`} />}
    </QueryBoundary>
  );
};

export default DevotionPage;
