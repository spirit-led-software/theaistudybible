import type { UserQueryCount } from '@revelationsai/core/model/user/query-count';
import { GetEntitiesSearchParams } from '../helpers/search-params';
import type {
  PaginatedEntitiesOptions,
  PaginatedEntitiesResponse,
  ProtectedApiOptions
} from '../types';
import apiConfig from '../../configs/api';

export async function getCurrentUsersQueryCounts(
  options: PaginatedEntitiesOptions & ProtectedApiOptions
) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/users/me/query-counts?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${options.session}`
      }
    }
  );

  if (!response.ok) {
    console.error(
      "Error retrieving current user's query counts. Received response:",
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || "Error retrieving current user's query counts");
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<UserQueryCount> =
    await response.json();

  return {
    queryCounts: entities,
    page,
    perPage
  };
}

export async function getUserQueryCounts(
  id: string,
  options: PaginatedEntitiesOptions & ProtectedApiOptions
) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/users/${id}/query-counts?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${options.session}`
      }
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving user's query counts with id ${id}. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || `Error retrieving user's query count with id ${id}`);
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<UserQueryCount> =
    await response.json();

  return {
    queryCounts: entities,
    page,
    perPage
  };
}
