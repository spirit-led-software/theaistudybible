import { PUBLIC_API_URL } from '$env/static/public';
import type { ProtectedApiOptions } from '$lib/services/types';
import type { Role } from '@revelationsai/core/model/role';
import type { CreateUserData, UpdateUserData, User } from '@revelationsai/core/model/user';

export async function createUser(
	data: Partial<CreateUserData> & {
		password?: string;
	},
	options: ProtectedApiOptions
) {
	const response = await fetch(`${PUBLIC_API_URL}/admin/users`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${options.session}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		console.error(
			`Error creating user. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error creating user.');
	}

	const user: User = await response.json();

	return user;
}

export async function updateUser(
	id: string,
	data: Partial<UpdateUserData>,
	options: ProtectedApiOptions
) {
	const response = await fetch(`${PUBLIC_API_URL}/admin/users/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${options.session}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		console.error(
			`Error updating user. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error updating user.');
	}

	const user: User = await response.json();

	return user;
}

export async function deleteUser(id: string, options: ProtectedApiOptions) {
	const response = await fetch(`${PUBLIC_API_URL}/admin/users/${id}`, {
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

	return true;
}

export async function getUserRoles(id: string, options: ProtectedApiOptions) {
	const response = await fetch(`${PUBLIC_API_URL}/admin/users/${id}/roles`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${options.session}`
		}
	});

	if (!response.ok) {
		console.error(
			`Error getting user roles. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error getting user roles.');
	}

	const roles: Role[] = await response.json();

	return roles;
}
