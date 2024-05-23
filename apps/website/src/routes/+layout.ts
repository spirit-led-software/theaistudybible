import { browser } from '$app/environment';
import { PUBLIC_WEBSITE_URL } from '$env/static/public';
import type { RouterType } from '$lib/server/api';
import { QueryClient } from '@tanstack/svelte-query';
import { hc } from 'hono/client';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ fetch }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser
      }
    }
  });

  const rpcClient = hc<RouterType>(`${PUBLIC_WEBSITE_URL}/api`, {
    fetch
  });

  return { queryClient, rpcClient };
};
