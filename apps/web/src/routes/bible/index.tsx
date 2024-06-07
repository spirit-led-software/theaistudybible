import { db } from '@lib/server/database';
import { RouteDefinition } from '@solidjs/router';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import { LargeTranslationPicker } from '~/components/bible/translation-picker';
import { QueryBoundary } from '~/components/query-boundary';

async function getBibles() {
  'use server';
  return await db.query.bibles.findMany();
}

const biblesQueryOptions = {
  queryKey: ['bibles'],
  queryFn: () => getBibles()
};

export const route: RouteDefinition = {
  load: async () => {
    const qc = useQueryClient();
    await qc.prefetchQuery(biblesQueryOptions);
  }
};

export default function BiblePage() {
  const biblesQuery = createQuery(() => biblesQueryOptions);

  return (
    <div class="flex w-full flex-col p-5 text-center">
      <QueryBoundary query={biblesQuery}>
        {(bibles) => <LargeTranslationPicker bibles={bibles} />}
      </QueryBoundary>
    </div>
  );
}
