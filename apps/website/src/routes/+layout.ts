import { browser } from '$app/environment';
import { PUBLIC_API_URL } from '$env/static/public';
import { QueryClient } from '@tanstack/svelte-query';
import type { RouterType } from '@theaistudybible/api';
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

  const rpcClient = hc<RouterType>(PUBLIC_API_URL, {
    fetch
  });

  return { queryClient, rpcClient };
};
