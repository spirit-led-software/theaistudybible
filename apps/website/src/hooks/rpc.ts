import { hc } from 'hono/client';
import type { RouterType, RpcClient } from '~/types/rpc';

export function useRpcClient() {
  return hc<RouterType>('/api') as unknown as RpcClient;
}
