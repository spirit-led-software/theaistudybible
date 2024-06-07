import { hc } from 'hono/client';
import { RouterType } from '~/types/rpc';

export const rpcClient = hc<RouterType>("/api");
