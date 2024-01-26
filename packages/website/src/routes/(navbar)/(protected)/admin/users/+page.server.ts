import { getUsers } from '@revelationsai/client/services/user';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const limit = 7;
	const { users } = await getUsers({
		limit,
		session: locals.session!
	});
	return {
		users,
		limit
	};
};
