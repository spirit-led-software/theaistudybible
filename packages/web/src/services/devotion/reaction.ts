import { apiConfig } from "@configs";
import { DevotionReaction } from "@core/model";
import { devotionReactions } from "@core/schema";
import { GetEntitiesSearchParams } from "@services/helpers/search-params";
import { EntitiesResponse, GetEntitiesOptions } from "@services/types";

export async function getDevotionReactions(
  id: string,
  options?: GetEntitiesOptions
) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/devotions/${id}/reactions?${searchParams.toString()}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving reactions for devotion with id ${id}. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(
      data.error || `Error retrieving reactions for devotion with id ${id}`
    );
  }

  const { entities, page, perPage }: EntitiesResponse<DevotionReaction> =
    await response.json();

  return {
    reactions: entities,
    page,
    perPage,
  };
}

export async function getDevotionReactionCounts(id: string) {
  const response = await fetch(
    `${apiConfig.url}/devotions/${id}/reactions/count`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving reaction counts for devotion with id ${id}. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(
      data.error ||
        `Error retrieving reaction counts for devotion with id ${id}`
    );
  }

  const reactionCounts: {
    [key in (typeof devotionReactions.reaction.enumValues)[number]]?: number;
  } = await response.json();

  return reactionCounts;
}
