import { PUBLIC_API_URL } from '$env/static/public';
import type { UserWithRoles } from '@core/model';

export async function getUserInfo() {
	const response = await fetch(`${PUBLIC_API_URL}/session`, {
		method: 'GET'
	});

	if (!response.ok) {
		console.error(
			`Error retrieving current user. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(
			data.error ||
				`Error retrieving current user. Received response: ${response.status} ${response.statusText}`
		);
	}

	const user: UserWithRoles = await response.json();

	return user;
}

export function isObjectOwner(object: { userId: string }, userId: string) {
	return object.userId === userId;
}

export function isAdmin(userInfo: UserWithRoles) {
	return userInfo.roles.some((role) => role.name === 'admin');
}
