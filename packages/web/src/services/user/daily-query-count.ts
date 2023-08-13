import { apiConfig } from "@configs/index";
import { UserDailyQueryCount } from "@core/model";
import { GetEntitiesSearchParams } from "@services/helpers/search-params";
import { getSessionTokenFromCookies } from "@services/session";
import { EntitiesResponse, GetEntitiesOptions } from "@services/types";

export async function getUserDailyQueryCounts(
  id: string,
  options?: GetEntitiesOptions
) {
  const token = getSessionTokenFromCookies();
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/api/users/${id}/query-count?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving user's query count with id ${id}. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(
      data.error || `Error retrieving user's query count with id ${id}`
    );
  }

  const { entities, page, perPage }: EntitiesResponse<UserDailyQueryCount> =
    await response.json();

  return {
    queryCounts: entities,
    page,
    perPage,
  };
}
