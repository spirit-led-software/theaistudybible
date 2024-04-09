import { PUBLIC_API_URL } from '$env/static/public';
import type { Chat } from '@revelationsai/core/model/chat';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch, locals }) => {
  const { id } = params;

  const response = await fetch(`${PUBLIC_API_URL}/chats/${id}/share`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${locals.session}`
    }
  });

  if (!response.ok) {
    return redirect(302, '/chat');
  }

  const chat: Chat = await response.json();

  return redirect(302, `/chat/${chat.id}`);
};
