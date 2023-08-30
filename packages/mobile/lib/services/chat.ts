import { apiConfig } from "@config";
import type {
  Chat,
  CreateChatData,
  UpdateChatData,
} from "@core/database/model";
import { aiResponses, userMessages } from "@core/database/schema";
import { getPropertyName } from "@core/util/object";
import { searchForAiResponses } from "./ai-response";
import { GetEntitiesSearchParams } from "./helpers/search-params";
import type {
  PaginatedEntitiesOptions,
  PaginatedEntitiesResponse,
  ProtectedApiOptions,
} from "./types";
import { searchForUserMessages } from "./user";
import { Message } from "@hooks/chat";

export async function getChats(
  options: PaginatedEntitiesOptions & ProtectedApiOptions
) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/chats?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${options.session}`,
      },
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving chats. Received response: ${response.status} ${response.statusText}`
    );
    const data = await response.json();
    throw new Error(data.error || "Error retrieving chats.");
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<Chat> =
    await response.json();

  return {
    chats: entities,
    page,
    perPage,
  };
}

export async function getChat(id: string, options: ProtectedApiOptions) {
  const response = await fetch(`${apiConfig.url}/chats/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${options.session}`,
    },
  });

  if (!response.ok) {
    console.error(
      `Error retrieving chat. Received response: ${response.status} ${response.statusText}`
    );
    const data = await response.json();
    throw new Error(data.error || "Error retrieving chat.");
  }

  const chat: Chat = await response.json();

  return chat;
}

export async function createChat(
  data: Partial<CreateChatData>,
  options: ProtectedApiOptions
) {
  const response = await fetch(`${apiConfig.url}/chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.session}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    console.error(
      `Error creating chat. Received response: ${response.status} ${response.statusText}`
    );
    const data = await response.json();
    throw new Error(data.error || "Error creating chat.");
  }

  const chat: Chat = await response.json();

  return chat;
}

export async function updateChat(
  id: string,
  data: Partial<UpdateChatData>,
  options: ProtectedApiOptions
) {
  const response = await fetch(`${apiConfig.url}/chats/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.session}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    console.error(
      `Error updating chat. Received response: ${response.status} ${response.statusText}`
    );
    const data = await response.json();
    throw new Error(data.error || "Error updating chat.");
  }

  const chat: Chat = await response.json();

  return chat;
}

export async function deleteChat(id: string, options: ProtectedApiOptions) {
  const response = await fetch(`${apiConfig.url}/chats/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${options.session}`,
    },
  });

  if (!response.ok) {
    console.error(
      `Error deleting chat. Received response: ${response.status} ${response.statusText}`
    );
    const data = await response.json();
    throw new Error(data.error || "Error deleting chat.");
  }

  return true;
}

export async function getChatMessages(
  chatId: string,
  userId: string,
  session: string
) {
  const { userMessages: foundUserMessages } = await searchForUserMessages({
    session,
    query: {
      AND: [
        {
          eq: {
            column: getPropertyName(
              userMessages,
              (userMessages) => userMessages.chatId
            ),
            value: chatId,
          },
        },
        {
          eq: {
            column: getPropertyName(
              userMessages,
              (userMessages) => userMessages.userId
            ),
            value: userId,
          },
        },
      ],
    },
  });

  const messages: Message[] = (
    await Promise.all(
      foundUserMessages.map(async (userMessage) => {
        const message: Message = {
          id: userMessage.aiId!,
          content: userMessage.text,
          role: "user",
        };

        const { aiResponses: foundAiResponses } = await searchForAiResponses({
          session,
          query: {
            eq: {
              column: getPropertyName(
                aiResponses,
                (aiResponses) => aiResponses.userMessageId
              ),
              value: userMessage.id,
            },
          },
        });

        const responses: Message[] = foundAiResponses
          .filter((aiResponse) => !aiResponse.failed && !aiResponse.regenerated)
          .map((aiResponse) => ({
            id: aiResponse.aiId!,
            content: aiResponse.text!,
            role: "assistant",
          }));
        return [responses[0], message];
      })
    )
  )
    .flat()
    .reverse();

  return messages;
}
