import type { app } from '$lib/server/api';
import type { ClientResponse, hc } from 'hono/client';

export type RouterType = typeof app;

export type RpcClient = ReturnType<typeof hc<RouterType>>['api'];

export type Route = keyof RouterType;

/**
 * Less verbose way to get the return type of an async function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ART<T extends (...args: any) => any> = Awaited<ReturnType<T>>;

/**
 * Get the JSON data from the rpc response
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JSON<T extends ClientResponse<any>> = ART<T['json']>;
