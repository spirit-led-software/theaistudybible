import { apiConfig } from "@configs/index";
import { DevotionImage } from "@core/model";
import { GetEntitiesSearchParams } from "@services/helpers/search-params";
import { EntitiesResponse, GetEntitiesOptions } from "@services/types";

export async function getDevotionImages(
  id: string,
  options?: GetEntitiesOptions
) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/devotions/${id}/images?${searchParams.toString()}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving images for devotion with id ${id}. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(
      data.error || `Error retrieving images for devotion with id ${id}`
    );
  }

  const { entities, page, perPage }: EntitiesResponse<DevotionImage> =
    await response.json();

  return {
    images: entities,
    page,
    perPage,
  };
}
