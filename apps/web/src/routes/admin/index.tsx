import { Navigate, RouteDefinition } from '@solidjs/router';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import { hasRole } from '@theaistudybible/core/user';
import { Show } from 'solid-js';
import { QueryBoundary } from '~/components/query-boundary';
import { auth } from '~/lib/server/clerk';

const isAdmin = () => {
  'use server';
  const { claims } = auth();
  return hasRole('admin', claims);
};

const isAdminQueryProps = {
  queryKey: ['is-admin'],
  queryFn: () => isAdmin()
};

export const route: RouteDefinition = {
  preload: () => {
    const qc = useQueryClient();
    qc.prefetchQuery(isAdminQueryProps);
  }
};

const AdminPage = () => {
  const isAdminQuery = createQuery(() => isAdminQueryProps);

  return (
    <QueryBoundary query={isAdminQuery}>
      {(isAdmin) => (
        <Show when={isAdmin} fallback={<Navigate href="/" />}>
          <div>Admin</div>
        </Show>
      )}
    </QueryBoundary>
  );
};

export default AdminPage;
