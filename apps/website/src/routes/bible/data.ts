import type { RpcClient } from '$lib/types/rpc';

export const getBibles = async (rpcClient: RpcClient) =>
  await rpcClient.bibles
    .$get()
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch bibles: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then((response) => response.data);
