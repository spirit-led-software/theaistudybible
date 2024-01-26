import { PUBLIC_API_URL } from '$env/static/public';
import type { DataSource } from '@revelationsai/core/model/data-source';
import { GetEntitiesSearchParams } from '../helpers/search-params';
import type { PaginatedEntitiesOptions, PaginatedEntitiesResponse } from '../types';

export async function getDataSources(options: PaginatedEntitiesOptions) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(`${PUBLIC_API_URL}/data-sources?${searchParams.toString()}`, {
    method: 'GET'
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

export async function getDataSource(id: string) {
  const response = await fetch(`${PUBLIC_API_URL}/data-sources/${id}`, {
    method: 'GET'
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
