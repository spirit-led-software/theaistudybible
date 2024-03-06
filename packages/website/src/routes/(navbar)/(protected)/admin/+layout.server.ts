import { isAdmin } from '@revelationsai/client/services/user';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user, session } }) => {
  if (!isAdmin(user!)) {
    redirect(307, '/');
  }

  return {
    user,
    session
  };
};
