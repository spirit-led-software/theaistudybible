import { app } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const fallback: RequestHandler = ({ request }) => app.fetch(request);
