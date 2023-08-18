import { PUBLIC_API_URL } from '$env/static/public';
import type { IndexOperation } from '@core/model';
import { GetEntitiesSearchParams } from './helpers/search-params';
import type {
	PaginatedEntitiesOptions,
	PaginatedEntitiesResponse,
	ProtectedApiOptions
} from './types';

export async function getIndexOperations(options: PaginatedEntitiesOptions & ProtectedApiOptions) {
	const searchParams = GetEntitiesSearchParams(options);
	const response = await fetch(`${PUBLIC_API_URL}/index-operations?${searchParams.toString()}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${options.session}`
		}
	});

	if (!response.ok) {
		console.error(
			`Error retrieving index operations. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error retrieving index operations.');
	}

	const { entities, page, perPage }: PaginatedEntitiesResponse<IndexOperation> =
		await response.json();

	return {
		indexOperations: entities,
		page,
		perPage
	};
}
