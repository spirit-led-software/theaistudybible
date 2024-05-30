import { browser } from '$app/environment';
import { QueryClient } from '@tanstack/svelte-query';
import type { RouterType } from '@theaistudybible/api';
import { hc } from 'hono/client';
import { Resource } from 'sst';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser
      }
    }
  });
  const rpcClient = hc<RouterType>(Resource.APIRouter.url);
  return { queryClient, rpcClient };
};
