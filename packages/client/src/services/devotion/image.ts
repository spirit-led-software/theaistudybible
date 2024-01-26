import { PUBLIC_API_URL } from '$env/static/public';
import type { DevotionImage } from '@revelationsai/core/model/devotion/image';
import { GetEntitiesSearchParams } from '../../../../website/src/lib/services/helpers/search-params';
import type {
  PaginatedEntitiesOptions,
  PaginatedEntitiesResponse
} from '../../../../website/src/lib/services/types';

export async function getDevotionImages(id: string, options?: PaginatedEntitiesOptions) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${PUBLIC_API_URL}/devotions/${id}/images?${searchParams.toString()}`,
    {
      method: 'GET'
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving images for devotion with id ${id}. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || `Error retrieving images for devotion with id ${id}`);
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<DevotionImage> =
    await response.json();

  return {
    images: entities,
    page,
    perPage
  };
}
