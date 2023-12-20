import { PUBLIC_API_URL } from '$env/static/public';
import type { UserInfo } from '@core/model/user';
import type { ProtectedApiOptions } from '../types';

export async function getUserInfo(session: string) {
	const response = await fetch(`${PUBLIC_API_URL}/auth/user-info`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${session}`
		}
	});

	if (!response.ok) {
		console.error(
			`Error retrieving current user. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error retrieving current user.');
	}

	const user: UserInfo = await response.json();

	return user;
}

export async function deleteUser(id: string, options: ProtectedApiOptions) {
	const response = await fetch(`${PUBLIC_API_URL}/users/${id}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${options.session}`
		}
	});

	if (!response.ok) {
		console.error(
			`Error deleting user. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error deleting user.');
	}
}

export function isObjectOwner(object: { userId: string }, userId: string) {
	return object.userId === userId;
}

export function isAdmin(userInfo: UserInfo) {
	return userInfo.roles.some((role) => role.name === 'admin');
}

export function getUserMaxQueries(userInfo: UserInfo) {
	const queryPermissions: string[] = [];
	userInfo.roles.forEach((role) => {
		const queryPermission = role.permissions.find((permission) => {
			return permission.startsWith('query:');
		});
		if (queryPermission) queryPermissions.push(queryPermission);
	});
	return Math.max(10, ...queryPermissions.map((p) => parseInt(p.split(':')[1])));
}
