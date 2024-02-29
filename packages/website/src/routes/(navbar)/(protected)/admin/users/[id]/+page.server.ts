import { db } from '@revelationsai/server/lib/database';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const user = await db.query.users.findFirst({
		where: ({ id }, { eq }) => eq(id, params.id),
		orderBy: ({ createdAt }, { desc }) => desc(createdAt)
	});

	if (!user) {
		return redirect(302, '/admin/users');
	}

	return {
		user
	};
};
