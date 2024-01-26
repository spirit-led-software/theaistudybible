import type { PaginatedEntitiesOptions } from '../types';

export const GetEntitiesSearchParams = (options?: PaginatedEntitiesOptions) => {
	const params = new URLSearchParams();

	if (options?.limit) {
		params.append('limit', options.limit.toString());
	}
	if (options?.page) {
		params.append('page', options.page.toString());
	}
	if (options?.order) {
		params.append('order', options.order);
	}
	if (options?.orderBy) {
		params.append('orderBy', options.orderBy);
	}

	return params;
};
