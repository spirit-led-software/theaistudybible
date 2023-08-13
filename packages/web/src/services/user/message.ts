import { apiConfig } from "@configs";
import { UserMessage } from "@core/model";
import { Query } from "@revelationsai/core/database/helpers";
import { GetEntitiesSearchParams } from "@services/helpers/search-params";
import { getSessionTokenFromCookies } from "@services/session";
import { EntitiesResponse, GetEntitiesOptions } from "@services/types";

export async function getUserMessages(options?: GetEntitiesOptions) {
  const token = getSessionTokenFromCookies();
  const searchParams = GetEntitiesSearchParams(options);

  const response = await fetch(
    `${apiConfig.url}/user-messages?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving user messages. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || "Error retrieving user messages.");
  }

  const { entities, page, perPage }: EntitiesResponse<UserMessage> =
    await response.json();

  return {
    userMessages: entities,
    page,
    perPage,
  };
}

export async function getUserMessage(id: string) {
  const token = getSessionTokenFromCookies();
  const response = await fetch(`${apiConfig.url}/user-messages/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(
      `Error retrieving user message. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || "Error retrieving user message.");
  }

  const userMessage: UserMessage = await response.json();

  return userMessage;
}

export async function searchForUserMessages(
  query: Query,
  options?: GetEntitiesOptions
) {
  const token = getSessionTokenFromCookies();
  const searchParams = GetEntitiesSearchParams(options);

  const response = await fetch(
    `${apiConfig.url}/user-messages/search?${searchParams.toString()}`,
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
      `Error searching for user messages. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || "Error searching for user messages.");
  }

  const { entities, page, perPage }: EntitiesResponse<UserMessage> =
    await response.json();

  return {
    userMessages: entities,
    page,
    perPage,
  };
}
