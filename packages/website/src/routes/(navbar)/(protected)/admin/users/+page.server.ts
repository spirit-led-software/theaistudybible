import { getUsers } from '@revelationsai/server/services/user';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const limit = 7;
	const users = await getUsers({
		limit
	});
	return {
		users,
		limit
	};
};
