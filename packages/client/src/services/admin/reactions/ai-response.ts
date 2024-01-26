import { PUBLIC_API_URL } from '$env/static/public';
import { GetEntitiesSearchParams } from '$lib/services/helpers/search-params';
import type {
	PaginatedEntitiesOptions,
	PaginatedEntitiesResponse,
	ProtectedApiOptions
} from '$lib/services/types';
import type { AiResponseReactionInfo } from '@revelationsai/core/model/ai-response/reaction';

export async function getAiResponseReactions(
	options?: PaginatedEntitiesOptions & ProtectedApiOptions
) {
	const searchParams = GetEntitiesSearchParams(options);
	const response = await fetch(
		`${PUBLIC_API_URL}/admin/reactions/ai-response?${searchParams.toString()}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${options?.session}`
			}
		}
	);

	if (!response.ok) {
		console.error(
			`Error retrieving reactions for aiResponses. Received response:`,
			JSON.stringify(response)
		);
		const data = await response.json();
		throw new Error(data.error || `Error retrieving reactions for aiResponses`);
	}

	const { entities, page, perPage }: PaginatedEntitiesResponse<AiResponseReactionInfo> =
		await response.json();

	return {
		reactions: entities,
		page,
		perPage
	};
}
