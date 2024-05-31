import { app } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const fallback: RequestHandler = async ({ request }) => app.fetch(request);
