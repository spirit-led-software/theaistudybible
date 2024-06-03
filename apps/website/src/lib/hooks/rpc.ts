import type { RpcClient } from '$lib/types/rpc';
import { getContext } from 'svelte';

export function useRpcClient() {
  return getContext('$$_rpcClient') as RpcClient;
}
