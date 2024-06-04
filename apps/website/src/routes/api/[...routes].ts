import type { APIEvent } from '@solidjs/start/server';
import { app } from '~/lib/server/api';

const handler = ({ request }: APIEvent) => app.fetch(request);

export const DELETE = handler;
export const GET = handler;
export const HEAD = handler;
export const OPTIONS = handler;
export const PATCH = handler;
export const POST = handler;
export const PUT = handler;
