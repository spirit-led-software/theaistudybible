import { PUBLIC_API_URL } from '$env/static/public';
import type { Chat, CreateChatData, UpdateChatData } from '@core/model';
import { GetEntitiesSearchParams } from './helpers/search-params';
import type {
	PaginatedEntitiesOptions,
	PaginatedEntitiesResponse,
	ProtectedApiOptions
} from './types';

export async function getChats(options: PaginatedEntitiesOptions & ProtectedApiOptions) {
	const searchParams = GetEntitiesSearchParams(options);
	const response = await fetch(`${PUBLIC_API_URL}/chats?${searchParams.toString()}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${options.session}`
		}
	});

	if (!response.ok) {
		console.error(
			`Error retrieving chats. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error retrieving chats.');
	}

	const { entities, page, perPage }: PaginatedEntitiesResponse<Chat> = await response.json();

	return {
		chats: entities,
		page,
		perPage
	};
}

export async function getChat(id: string, options: ProtectedApiOptions) {
	const response = await fetch(`${PUBLIC_API_URL}/chats/${id}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${options.session}`
		}
	});

	if (!response.ok) {
		console.error(
			`Error retrieving chat. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error retrieving chat.');
	}

	const chat: Chat = await response.json();

	return chat;
}

export async function createChat(data: Partial<CreateChatData>, options: ProtectedApiOptions) {
	const response = await fetch(`${PUBLIC_API_URL}/chats`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${options.session}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		console.error(
			`Error creating chat. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error creating chat.');
	}

	const chat: Chat = await response.json();

	return chat;
}

export async function updateChat(
	id: string,
	data: Partial<UpdateChatData>,
	options: ProtectedApiOptions
) {
	const response = await fetch(`${PUBLIC_API_URL}/chats/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${options.session}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		console.error(
			`Error updating chat. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error updating chat.');
	}

	const chat: Chat = await response.json();

	return chat;
}

export async function deleteChat(id: string, options: ProtectedApiOptions) {
	const response = await fetch(`${PUBLIC_API_URL}/chats/${id}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${options.session}`
		}
	});

	if (!response.ok) {
		console.error(
			`Error deleting chat. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error deleting chat.');
	}

	return true;
}
