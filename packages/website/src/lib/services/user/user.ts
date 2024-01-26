import { PUBLIC_API_URL } from '$env/static/public';
import type { User, UserInfo } from '@revelationsai/core/model/user';
import { GetEntitiesSearchParams } from '../helpers/search-params';
import type {
	PaginatedEntitiesOptions,
	PaginatedEntitiesResponse,
	ProtectedApiOptions,
	SearchForEntitiesOptions
} from '../types';

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

export async function getUsers(options: PaginatedEntitiesOptions & ProtectedApiOptions) {
	const searchParams = GetEntitiesSearchParams(options);
	const response = await fetch(`${PUBLIC_API_URL}/users?${searchParams.toString()}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${options.session}`
		}
	});

	if (!response.ok) {
		console.error(
			`Error retrieving users. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error retrieving users.');
	}

	const { entities, page, perPage }: PaginatedEntitiesResponse<User> = await response.json();

	return {
		users: entities,
		page,
		perPage
	};
}

export async function searchForUsers(
	options: SearchForEntitiesOptions & PaginatedEntitiesOptions & ProtectedApiOptions
) {
	const searchParams = GetEntitiesSearchParams(options);
	const response = await fetch(`${PUBLIC_API_URL}/users/search?${searchParams.toString()}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${options.session}`
		},
		body: JSON.stringify(options.query)
	});

	if (!response.ok) {
		console.error(
			`Error searching for users. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error searching for users.');
	}

	const { entities, page, perPage }: PaginatedEntitiesResponse<User> = await response.json();

	return {
		users: entities,
		page,
		perPage
	};
}

export async function getUser(id: string, options: ProtectedApiOptions) {
	const response = await fetch(`${PUBLIC_API_URL}/users/${id}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${options.session}`
		}
	});

	if (!response.ok) {
		console.error(
			`Error retrieving user. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error retrieving user.');
	}

	const user: User = await response.json();

	return user;
}

export function isObjectOwner(object: { userId: string }, userId: string) {
	return object.userId === userId;
}

export function isAdmin(userInfo: UserInfo) {
	return userInfo.roles.some((role) => role.name === 'admin');
}

export function hasPlus(userInfo: UserInfo) {
	return userInfo.roles.some((role) => role.name === 'rc:plus');
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
