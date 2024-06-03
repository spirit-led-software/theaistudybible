import type { RpcClient } from '$lib/types/rpc';

export const getBibles = async (rpcClient: RpcClient) =>
  await rpcClient.bibles.$get().then(async (response) => {
    if (response.ok) {
      return (await response.json()).data;
    }
    throw new Error('Failed to fetch Bibles');
  });
