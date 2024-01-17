import { PUBLIC_API_URL } from '$env/static/public';
import type { devotionReactions } from '@core/database/schema';
import type { DevotionReaction } from '@core/model/devotion/reaction';
import { GetEntitiesSearchParams } from '../helpers/search-params';
import type { PaginatedEntitiesOptions, PaginatedEntitiesResponse } from '../types';

export async function getDevotionReactionsById(id: string, options?: PaginatedEntitiesOptions) {
	const searchParams = GetEntitiesSearchParams(options);
	const response = await fetch(
		`${PUBLIC_API_URL}/devotions/${id}/reactions?${searchParams.toString()}`,
		{
			method: 'GET'
		}
	);

	if (!response.ok) {
		console.error(
			`Error retrieving reactions for devotion with id ${id}. Received response:`,
			JSON.stringify(response)
		);
		const data = await response.json();
		throw new Error(data.error || `Error retrieving reactions for devotion with id ${id}`);
	}

	const { entities, page, perPage }: PaginatedEntitiesResponse<DevotionReaction> =
		await response.json();

	return {
		reactions: entities,
		page,
		perPage
	};
}

export async function getDevotionReactionCounts(id: string) {
	const response = await fetch(`${PUBLIC_API_URL}/devotions/${id}/reactions/counts`, {
		method: 'GET'
	});

	if (!response.ok) {
		console.error(
			`Error retrieving reaction counts for devotion with id ${id}. Received response:`,
			JSON.stringify(response)
		);
		const data = await response.json();
		throw new Error(data.error || `Error retrieving reaction counts for devotion with id ${id}`);
	}

	const reactionCounts: {
		[key in (typeof devotionReactions.reaction.enumValues)[number]]?: number;
	} = await response.json();

	return reactionCounts;
}
