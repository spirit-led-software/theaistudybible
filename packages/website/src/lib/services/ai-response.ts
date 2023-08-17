import { PUBLIC_API_URL } from '$env/static/public';
import type {
	AiResponse,
	CreateAiResponseData,
	SourceDocument,
	UpdateAiResponseData
} from '@core/model';
import { GetEntitiesSearchParams } from './helpers/search-params';
import type {
	PaginatedEntitiesOptions,
	PaginatedEntitiesResponse,
	SearchForEntitiesOptions
} from './types';

export async function getAiResponses(options: PaginatedEntitiesOptions) {
	const searchParams = GetEntitiesSearchParams(options);
	const response = await fetch(`${PUBLIC_API_URL}/ai-responses?${searchParams.toString()}`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		console.error(`Error retrieving AI responses. Received response:`, JSON.stringify(response));
		const data = await response.json();
		throw new Error(data.error || 'Error retrieving AI responses.');
	}

	const { entities, page, perPage }: PaginatedEntitiesResponse<AiResponse> = await response.json();

	return {
		aiResponses: entities,
		page,
		perPage
	};
}

export async function getAiResponse(id: string) {
	const response = await fetch(`${PUBLIC_API_URL}/ai-responses/${id}`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		console.error(`Error retrieving AI response. Received response:`, JSON.stringify(response));
		const data = await response.json();
		throw new Error(data.error || 'Error retrieving AI response.');
	}

	const aiResponse: AiResponse = await response.json();

	return aiResponse;
}

export async function searchForAiResponses(
	options: SearchForEntitiesOptions & PaginatedEntitiesOptions
) {
	const searchParams = GetEntitiesSearchParams(options);
	const response = await fetch(`${PUBLIC_API_URL}/ai-responses/search?${searchParams.toString()}`, {
		method: 'POST',
		credentials: 'include',
		body: JSON.stringify(options.query)
	});

	if (!response.ok) {
		console.error(`Error searching for AI responses. Received response:`, JSON.stringify(response));
		const data = await response.json();
		throw new Error(data.error || 'Error searching for AI responses.');
	}

	const { entities, page, perPage }: PaginatedEntitiesResponse<AiResponse> = await response.json();

	return {
		aiResponses: entities,
		page,
		perPage
	};
}

export async function getAiResponseSourceDocuments(id: string) {
	const response = await fetch(`${PUBLIC_API_URL}/ai-responses/${id}/source-documents`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!response.ok) {
		console.error(
			`Error retrieving source documents for AI response with id ${id}. Received response:`,
			JSON.stringify(response)
		);
		const data = await response.json();
		throw new Error(
			data.error || `Error retrieving source documents for AI response with id ${id}`
		);
	}

	const sourceDocuments: SourceDocument[] = await response.json();

	return sourceDocuments;
}

export async function createAiResponse(data: Partial<CreateAiResponseData>) {
	const response = await fetch(`${PUBLIC_API_URL}/ai-responses`, {
		method: 'POST',
		credentials: 'include',
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		console.error(`Error creating AI response. Received response:`, JSON.stringify(response));
		const data = await response.json();
		throw new Error(data.error || 'Error creating AI response.');
	}

	const aiResponse: AiResponse = await response.json();

	return aiResponse;
}

export async function updateAiResponse(id: string, data: Partial<UpdateAiResponseData>) {
	const response = await fetch(`${PUBLIC_API_URL}/ai-responses/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include',
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		console.error(`Error updating AI response. Received response:`, JSON.stringify(response));
		const data = await response.json();
		throw new Error(data.error || 'Error updating AI response.');
	}

	const aiResponse: AiResponse = await response.json();

	return aiResponse;
}

export async function deleteAiResponse(id: string) {
	const response = await fetch(`${PUBLIC_API_URL}/ai-responses/${id}`, {
		method: 'DELETE',
		credentials: 'include'
	});

	if (!response.ok) {
		console.error(`Error deleting AI response. Received response:`, JSON.stringify(response));
		const data = await response.json();
		throw new Error(data.error || 'Error deleting AI response.');
	}

	return true;
}
