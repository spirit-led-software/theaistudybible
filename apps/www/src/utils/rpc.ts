import type { RouterType } from '@/www/types/rpc';
import { hc } from 'hono/client';

export const rpcClient = hc<RouterType>('/api');
