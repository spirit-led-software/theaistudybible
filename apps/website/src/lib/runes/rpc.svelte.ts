import type { RpcClient } from '../types/rpc';

export function createRpcClient(initRpcClient?: RpcClient) {
  const rpcClient = $state(initRpcClient);

  return {
    get rpcClient() {
      return rpcClient;
    }
  };
}

export function useRpcClient() {
  const { rpcClient } = createRpcClient();
  return {
    get rpcClient() {
      if (!rpcClient) {
        throw new Error('RPC client not initialized');
      } else {
        return rpcClient;
      }
    }
  };
}
