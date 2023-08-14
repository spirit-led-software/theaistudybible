import { apiConfig } from "@configs";
import { UserQueryCount } from "@core/model";
import { GetEntitiesSearchParams } from "@services/helpers/search-params";
import {
  PaginatedEntitiesOptions,
  PaginatedEntitiesResponse,
  ProtectedApiOptions,
} from "@services/types";

export async function getCurrentUsersQueryCounts(
  options: PaginatedEntitiesOptions & ProtectedApiOptions
) {
  const token = options.token;
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/users/me/query-counts?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    console.error(
      "Error retrieving current user's query counts. Received response:",
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(
      data.error || "Error retrieving current user's query counts"
    );
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<UserQueryCount> =
    await response.json();

  return {
    queryCounts: entities,
    page,
    perPage,
  };
}

export async function getUserQueryCounts(
  id: string,
  options: PaginatedEntitiesOptions & ProtectedApiOptions
) {
  const token = options.token;
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/users/${id}/query-counts?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving user's query counts with id ${id}. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(
      data.error || `Error retrieving user's query count with id ${id}`
    );
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<UserQueryCount> =
    await response.json();

  return {
    queryCounts: entities,
    page,
    perPage,
  };
}
