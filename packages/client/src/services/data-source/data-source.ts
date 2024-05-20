import type { DataSource } from '@revelationsai/core/model/data-source';
import apiConfig from '../../configs/api';
import { GetEntitiesSearchParams } from '../helpers/search-params';
import type { PaginatedEntitiesOptions, PaginatedEntitiesResponse } from '../types';

export async function getDataSources(options: PaginatedEntitiesOptions) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(`${apiConfig.url}/data-sources?${searchParams.toString()}`, {
    method: 'GET'
  });

  if (!response.ok) {
    console.error(
      `Error retrieving data sources. Received response: ${response.status} ${response.statusText}`
    );
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || 'Error retrieving data sources.');
  }

  const { entities, page, perPage } =
    (await response.json()) as PaginatedEntitiesResponse<DataSource>;

  return {
    dataSources: entities,
    page,
    perPage
  };
}

export async function getDataSource(id: string) {
  const response = await fetch(`${apiConfig.url}/data-sources/${id}`, {
    method: 'GET'
  });

  if (!response.ok) {
    console.error(
      `Error retrieving data source. Received response: ${response.status} ${response.statusText}`
    );
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || 'Error retrieving data source.');
  }

  const dataSource = (await response.json()) as DataSource;

  return dataSource;
}
