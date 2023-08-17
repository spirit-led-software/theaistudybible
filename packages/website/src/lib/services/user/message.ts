import { PUBLIC_API_URL } from '$env/static/public';
import type { UserMessage } from '@core/model';
import { GetEntitiesSearchParams } from '../helpers/search-params';
import type {
	PaginatedEntitiesOptions,
	PaginatedEntitiesResponse,
	SearchForEntitiesOptions
} from '../types';

export async function getUserMessages(options: PaginatedEntitiesOptions) {
	const searchParams = GetEntitiesSearchParams(options);
	const response = await fetch(`${PUBLIC_API_URL}/user-messages?${searchParams.toString()}`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		console.error(`Error retrieving user messages. Received response:`, JSON.stringify(response));
		const data = await response.json();
		throw new Error(data.error || 'Error retrieving user messages.');
	}

	const { entities, page, perPage }: PaginatedEntitiesResponse<UserMessage> = await response.json();

	return {
		userMessages: entities,
		page,
		perPage
	};
}

export async function getUserMessage(id: string) {
	const response = await fetch(`${PUBLIC_API_URL}/user-messages/${id}`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		console.error(`Error retrieving user message. Received response:`, JSON.stringify(response));
		const data = await response.json();
		throw new Error(data.error || 'Error retrieving user message.');
	}

	const userMessage: UserMessage = await response.json();

	return userMessage;
}

export async function searchForUserMessages(
	options: SearchForEntitiesOptions & PaginatedEntitiesOptions
) {
	const searchParams = GetEntitiesSearchParams(options);
	const response = await fetch(
		`${PUBLIC_API_URL}/user-messages/search?${searchParams.toString()}`,
		{
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify(options.query)
		}
	);

	if (!response.ok) {
		console.error(
			`Error searching for user messages. Received response:`,
			JSON.stringify(response)
		);
		const data = await response.json();
		throw new Error(data.error || 'Error searching for user messages.');
	}

	const { entities, page, perPage }: PaginatedEntitiesResponse<UserMessage> = await response.json();

	return {
		userMessages: entities,
		page,
		perPage
	};
}
