import { db } from '$lib/server/database';
import { users as usersTable } from '@revelationsai/core/database/schema';
import { count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [users, userCount] = await Promise.all([
		db.query.users.findMany({
			limit: 13,
			orderBy: ({ createdAt }, { desc }) => desc(createdAt),
			with: {
				usersToRoles: {
					with: {
						role: true
					}
				}
			}
		}),
		db
			.select({ count: count() })
			.from(usersTable)
			.then((results) => results[0].count)
	]);
	return {
		users,
		userCount
	};
};
