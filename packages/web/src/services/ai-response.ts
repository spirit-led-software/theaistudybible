import { apiConfig } from "@configs";
import { AiResponse } from "@core/model";
import { Query } from "@revelationsai/core/database/helpers";
import { GetEntitiesSearchParams } from "./helpers/search-params";
import { getSessionTokenFromCookies } from "./session";
import { EntitiesResponse, GetEntitiesOptions } from "./types";

export async function getAiResponses(options?: GetEntitiesOptions) {
  const token = getSessionTokenFromCookies();
  const searchParams = GetEntitiesSearchParams(options);

  const response = await fetch(
    `${apiConfig.url}/ai-responses?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving AI responses. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || "Error retrieving AI responses.");
  }

  const { entities, page, perPage }: EntitiesResponse<AiResponse> =
    await response.json();

  return {
    aiResponses: entities,
    page,
    perPage,
  };
}

export async function getAiResponse(id: string) {
  const token = getSessionTokenFromCookies();
  const response = await fetch(`${apiConfig.url}/ai-responses/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(
      `Error retrieving AI response. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || "Error retrieving AI response.");
  }

  const aiResponse: AiResponse = await response.json();

  return aiResponse;
}

export async function searchForAiResponses(
  query: Query,
  options?: GetEntitiesOptions
) {
  const token = getSessionTokenFromCookies();
  const searchParams = GetEntitiesSearchParams(options);

  const response = await fetch(
    `${apiConfig.url}/ai-responses/search?${searchParams.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(query),
    }
  );

  if (!response.ok) {
    console.error(
      `Error searching for AI responses. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || "Error searching for AI responses.");
  }

  const { entities, page, perPage }: EntitiesResponse<AiResponse> =
    await response.json();

  return {
    aiResponses: entities,
    page,
    perPage,
  };
}
