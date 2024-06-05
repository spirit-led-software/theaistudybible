import { hc } from 'hono/client';
import { RouterType } from '~/types/rpc';

export const rpcClient = hc<RouterType>(import.meta.env.VITE_API_URL);
