import type { AiResponseReaction } from '@revelationsai/core/model/ai-response/reaction';
import apiConfig from '../../configs/api';
import { GetEntitiesSearchParams } from '../helpers/search-params';
import type {
  PaginatedEntitiesOptions,
  PaginatedEntitiesResponse,
  ProtectedApiOptions
} from '../types';

export async function getAiResponseReactionsById(
  id: string,
  options?: PaginatedEntitiesOptions & ProtectedApiOptions
) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/ai-responses/${id}/reactions?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${options?.session}`
      }
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving reactions for aiResponse with id ${id}. Received response:`,
      JSON.stringify(response)
    );
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || `Error retrieving reactions for aiResponse with id ${id}`);
  }

  const { entities, page, perPage } =
    (await response.json()) as PaginatedEntitiesResponse<AiResponseReaction>;

  return {
    reactions: entities,
    page,
    perPage
  };
}
