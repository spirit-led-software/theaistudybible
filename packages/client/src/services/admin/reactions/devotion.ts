import { PUBLIC_API_URL } from '$env/static/public';
import type { DevotionReactionInfo } from '@revelationsai/core/model/devotion/reaction';
import { GetEntitiesSearchParams } from '../../../../../website/src/lib/services/helpers/search-params';
import type {
  PaginatedEntitiesOptions,
  PaginatedEntitiesResponse,
  ProtectedApiOptions
} from '../../../../../website/src/lib/services/types';

export async function getDevotionReactions(
  options?: PaginatedEntitiesOptions & ProtectedApiOptions
) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${PUBLIC_API_URL}/admin/reactions/devotion?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${options?.session}`
      }
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving reactions for devotions. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || `Error retrieving reactions for devotions`);
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<DevotionReactionInfo> =
    await response.json();

  return {
    reactions: entities,
    page,
    perPage
  };
}
