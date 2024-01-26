import type { DevotionReactionInfo } from '@revelationsai/core/model/devotion/reaction';
import apiConfig from '../../../configs/api';
import { GetEntitiesSearchParams } from '../../helpers/search-params';
import type {
  PaginatedEntitiesOptions,
  ProtectedApiOptions,
  PaginatedEntitiesResponse
} from '../../types';

export async function getDevotionReactions(
  options?: PaginatedEntitiesOptions & ProtectedApiOptions
) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/admin/reactions/devotion?${searchParams.toString()}`,
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
