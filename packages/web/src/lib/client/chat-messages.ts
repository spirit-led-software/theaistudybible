import { websiteConfig } from "@configs/index";
import { ChatMessage } from "@types";
import { validateResponse } from "./base";

type ChatMessageRequest = {
  message: string;
  chatId: string;
};

export async function getChatMessages(init?: RequestInit) {
  let error = undefined;
  const response = await fetch(`${websiteConfig.url}/api/chats/messages`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...init,
  });
  const { error: valError } = validateResponse(response);
  error = valError;

  const data: ChatMessage[] = await response.json();
  return {
    message: data,
    error,
  };
}

export async function getChatMessage(id: string, init?: RequestInit) {
  let error = undefined;
  const response = await fetch(`${websiteConfig.url}/api/chat-messages/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...init,
  });
  const { error: valError } = validateResponse(response);
  error = valError;
  const data: ChatMessage = await response.json();
  return {
    message: data,
    error,
  };
}
