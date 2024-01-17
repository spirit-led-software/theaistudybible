import { PUBLIC_API_URL } from '$env/static/public';
import type { AiResponseReaction } from '@core/model/ai-response/reaction';
import { GetEntitiesSearchParams } from '../helpers/search-params';
import type {
	PaginatedEntitiesOptions,
	PaginatedEntitiesResponse,
	ProtectedApiOptions
} from '../types';

export async function getAiResponseReactionsById(
	id: string,
	options?: PaginatedEntitiesOptions & ProtectedApiOptions
) {
	const searchParams = GetEntitiesSearchParams(options);
	const response = await fetch(
		`${PUBLIC_API_URL}/ai-responses/${id}/reactions?${searchParams.toString()}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${options?.session}`
			}
		}
	);

	if (!response.ok) {
		console.error(
			`Error retrieving reactions for aiResponse with id ${id}. Received response:`,
			JSON.stringify(response)
		);
		const data = await response.json();
		throw new Error(data.error || `Error retrieving reactions for aiResponse with id ${id}`);
	}

	const { entities, page, perPage }: PaginatedEntitiesResponse<AiResponseReaction> =
		await response.json();

	return {
		reactions: entities,
		page,
		perPage
	};
}
