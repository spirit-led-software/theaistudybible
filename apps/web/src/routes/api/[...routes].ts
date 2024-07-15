import { APIEvent } from '@solidjs/start/server';
import { app } from '~/server/api';

export const DELETE = ({ request }: APIEvent) => app.fetch(request);
export const GET = ({ request }: APIEvent) => app.fetch(request);
export const HEAD = ({ request }: APIEvent) => app.fetch(request);
export const OPTIONS = ({ request }: APIEvent) => app.fetch(request);
export const PATCH = ({ request }: APIEvent) => app.fetch(request);
export const POST = ({ request }: APIEvent) => app.fetch(request);
export const PUT = ({ request }: APIEvent) => app.fetch(request);
