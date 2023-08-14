import { apiConfig } from "@configs";
import { UserMessage } from "@core/model";
import { GetEntitiesSearchParams } from "@services/helpers/search-params";
import {
  PaginatedEntitiesOptions,
  PaginatedEntitiesResponse,
  ProtectedApiOptions,
  SearchForEntitiesOptions,
} from "@services/types";

export async function getUserMessages(
  options: PaginatedEntitiesOptions & ProtectedApiOptions
) {
  const token = options.token;
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

  const { entities, page, perPage }: PaginatedEntitiesResponse<UserMessage> =
    await response.json();

  return {
    userMessages: entities,
    page,
    perPage,
  };
}

export async function getUserMessage(id: string, options: ProtectedApiOptions) {
  const token = options.token;
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
  options: SearchForEntitiesOptions &
    PaginatedEntitiesOptions &
    ProtectedApiOptions
) {
  const token = options.token;
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/user-messages/search?${searchParams.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(options.query),
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

  const { entities, page, perPage }: PaginatedEntitiesResponse<UserMessage> =
    await response.json();

  return {
    userMessages: entities,
    page,
    perPage,
  };
}
