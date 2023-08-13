import { apiConfig } from "@configs";
import { Chat } from "@core/model";
import { GetEntitiesSearchParams } from "./helpers/search-params";
import { getSessionTokenFromCookies } from "./session";
import { EntitiesResponse, GetEntitiesOptions } from "./types";

export async function getChats(options?: GetEntitiesOptions) {
  const token = getSessionTokenFromCookies();
  const searchParams = GetEntitiesSearchParams(options);

  const response = await fetch(
    `${apiConfig.url}/chats?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving chats. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || "Error retrieving chats.");
  }

  const { entities, page, perPage }: EntitiesResponse<Chat> =
    await response.json();

  return {
    chats: entities,
    page,
    perPage,
  };
}

export async function getChat(id: string) {
  const token = getSessionTokenFromCookies();
  const response = await fetch(`${apiConfig.url}/chats/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(
      `Error retrieving chat. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || "Error retrieving chat.");
  }

  const chat: Chat = await response.json();

  return chat;
}
