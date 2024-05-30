import { browser } from '$app/environment';
import { QueryClient } from '@tanstack/svelte-query';
import type { RouterType } from '@theaistudybible/api';
import { hc } from 'hono/client';
import { Resource } from 'sst';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ fetch }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser
      }
    }
  });
  const rpcClient = hc<RouterType>(Resource.APIRouter.url, {
    fetch
  });
  return { queryClient, rpcClient };
};
