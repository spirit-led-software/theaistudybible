import { browser } from '$app/environment';
import type { RouterType, RpcClient } from '$lib/types/rpc';
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
  const rpcClient = hc<RouterType>('/api', {
    fetch
  }) as unknown as RpcClient;
  return { queryClient, rpcClient };
};
