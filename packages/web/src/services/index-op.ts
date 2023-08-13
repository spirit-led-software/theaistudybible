import { apiConfig } from "@configs";
import { IndexOperation } from "@core/model";
import { GetEntitiesSearchParams } from "./helpers/search-params";
import { EntitiesResponse, GetEntitiesOptions } from "./types";

export async function getIndexOperations(options: GetEntitiesOptions) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/index-operations?${searchParams.toString()}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving index operations. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || "Error retrieving index operations.");
  }

  const { entities, page, perPage }: EntitiesResponse<IndexOperation> =
    await response.json();

  return {
    indexOperations: entities,
    page,
    perPage,
  };
}
