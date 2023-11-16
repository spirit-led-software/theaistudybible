import { PUBLIC_API_URL } from '$env/static/public';
import type { CreateDataSourceData, DataSource, UpdateDataSourceData } from '@core/model';
import { GetEntitiesSearchParams } from '../helpers/search-params';
import type {
	PaginatedEntitiesOptions,
	PaginatedEntitiesResponse,
	ProtectedApiOptions
} from '../types';

export async function getDataSources(options: PaginatedEntitiesOptions & ProtectedApiOptions) {
	const searchParams = GetEntitiesSearchParams(options);
	const response = await fetch(`${PUBLIC_API_URL}/data-sources?${searchParams.toString()}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${options.session}`
		}
	});

	if (!response.ok) {
		console.error(
			`Error retrieving data sources. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error retrieving data sources.');
	}

	const { entities, page, perPage }: PaginatedEntitiesResponse<DataSource> = await response.json();

	return {
		dataSources: entities,
		page,
		perPage
	};
}

export async function getDataSource(id: string, options: ProtectedApiOptions) {
	const response = await fetch(`${PUBLIC_API_URL}/data-sources/${id}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${options.session}`
		}
	});

	if (!response.ok) {
		console.error(
			`Error retrieving data source. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error retrieving data source.');
	}

	const dataSource: DataSource = await response.json();

	return dataSource;
}

export async function createDataSource(data: CreateDataSourceData, options: ProtectedApiOptions) {
	const response = await fetch(`${PUBLIC_API_URL}/data-sources`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${options.session}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		console.error(
			`Error creating data source. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error creating data source.');
	}

	const dataSource: DataSource = await response.json();

	return dataSource;
}

export async function updateDataSource(
	id: string,
	data: Partial<UpdateDataSourceData>,
	options: ProtectedApiOptions
) {
	const response = await fetch(`${PUBLIC_API_URL}/data-sources/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${options.session}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		console.error(
			`Error updating data source. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error updating data source.');
	}

	const dataSource: DataSource = await response.json();

	return dataSource;
}

export async function deleteDataSource(id: string, options: ProtectedApiOptions) {
	const response = await fetch(`${PUBLIC_API_URL}/data-sources/${id}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${options.session}`
		}
	});

	if (!response.ok) {
		console.error(
			`Error deleting data source. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error deleting data source.');
	}

	return true;
}

export async function syncDataSource(id: string, options: ProtectedApiOptions) {
	const response = await fetch(`${PUBLIC_API_URL}/data-sources/${id}/sync`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${options.session}`
		}
	});

	if (!response.ok) {
		console.error(
			`Error syncing data source. Received response: ${response.status} ${response.statusText}`
		);
		const data = await response.json();
		throw new Error(data.error || 'Error syncing data source.');
	}

	const dataSource: DataSource = await response.json();

	return dataSource;
}
