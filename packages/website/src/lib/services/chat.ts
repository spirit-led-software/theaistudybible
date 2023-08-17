import { PUBLIC_API_URL } from '$env/static/public';
import type { Chat, CreateChatData, UpdateChatData } from '@core/model';
import { GetEntitiesSearchParams } from './helpers/search-params';
import type { PaginatedEntitiesOptions, PaginatedEntitiesResponse } from './types';

export async function getChats(options: PaginatedEntitiesOptions) {
	const searchParams = GetEntitiesSearchParams(options);
	const response = await fetch(`${PUBLIC_API_URL}/chats?${searchParams.toString()}`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		console.error(`Error retrieving chats. Received response:`, JSON.stringify(response));
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

export async function getChat(id: string) {
	const response = await fetch(`${PUBLIC_API_URL}/chats/${id}`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		console.error(`Error retrieving chat. Received response:`, JSON.stringify(response));
		const data = await response.json();
		throw new Error(data.error || 'Error retrieving chat.');
	}

	const chat: Chat = await response.json();

	return chat;
}

export async function createChat(data: Partial<CreateChatData>) {
	const response = await fetch(`${PUBLIC_API_URL}/chats`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include',
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		console.error(`Error creating chat. Received response:`, JSON.stringify(response));
		const data = await response.json();
		throw new Error(data.error || 'Error creating chat.');
	}

	const chat: Chat = await response.json();

	return chat;
}

export async function updateChat(id: string, data: Partial<UpdateChatData>) {
	const response = await fetch(`${PUBLIC_API_URL}/chats/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include',
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		console.error(`Error updating chat. Received response:`, JSON.stringify(response));
		const data = await response.json();
		throw new Error(data.error || 'Error updating chat.');
	}

	const chat: Chat = await response.json();

	return chat;
}

export async function deleteChat(id: string) {
	const response = await fetch(`${PUBLIC_API_URL}/chats/${id}`, {
		method: 'DELETE',
		credentials: 'include'
	});

	if (!response.ok) {
		console.error(`Error deleting chat. Received response:`, JSON.stringify(response));
		const data = await response.json();
		throw new Error(data.error || 'Error deleting chat.');
	}

	return true;
}
