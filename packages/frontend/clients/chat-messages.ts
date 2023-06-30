import { apiConfig } from "@/configs";
import { ChatMessage } from "@/types";
import ChatAnswer from "@/types/chat-answer";
import { validateResponse } from "./base";

type ChatMessageRequest = {
  message: string;
  chatId: string;
};

export async function sendMessage(
  request: ChatMessageRequest,
  readHandler?: (
    reader: ReadableStreamDefaultReader<Uint8Array>
  ) => Promise<void>
) {
  let error = undefined;
  const result = await fetch(
    `${apiConfig.apiUrl}${apiConfig.apiBasePath}/chat-messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: request.message,
        chatId: request.chatId,
      }),
    }
  );
  const { error: validationError } = validateResponse(result);
  error = validationError;
  const reader = result.body?.getReader();
  if (!reader) {
    error = new Error("No stream reader returned from request.");
  }
  const chatId = result.headers.get("X-Chat-ID");
  if (!chatId) {
    error = new Error("No chat ID returned from request.");
  }
  const chatMessageId = result.headers.get("X-Chat-Message-ID");
  if (!chatMessageId) {
    error = new Error("No chat message ID returned from request.");
  }

  if (readHandler) {
    readHandler(reader!);
  }

  return {
    reader,
    chatId,
    chatMessageId,
    error,
  };
}

export async function getChatMessages() {
  let error = undefined;
  const response = await fetch(
    `${apiConfig.apiUrl}${apiConfig.apiBasePath}/chat-messages`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
  const { error: valError } = validateResponse(response);
  error = valError;

  const data: ChatMessage[] = await response.json();
  return {
    message: data,
    error,
  };
}

export async function getChatMessage(id: string) {
  let error = undefined;
  const response = await fetch(
    `${apiConfig.apiUrl}${apiConfig.apiBasePath}/chat-messages/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
  const { error: valError } = validateResponse(response);
  error = valError;
  const data: ChatMessage = await response.json();
  return {
    message: data,
    error,
  };
}

export async function getChatMessageResult(id: string) {
  let error = undefined;
  const response = await fetch(
    `${apiConfig.apiUrl}${apiConfig.apiBasePath}/chat-messages/${id}/result`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
  const { error: valError } = validateResponse(response);
  error = valError;
  const data: ChatAnswer = await response.json();
  return {
    messageResult: data,
    error,
  };
}
