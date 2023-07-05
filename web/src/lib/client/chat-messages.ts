import { ChatAnswer, ChatMessage } from '@types';
import { validateResponse } from './base';

type ChatMessageRequest = {
  message: string;
  chatId: string;
};

export async function sendMessage(
  request: ChatMessageRequest,
  readHandler?: (
    reader: ReadableStreamDefaultReader<Uint8Array>
  ) => Promise<void>,
  init?: RequestInit
) {
  let error = undefined;
  const result = await fetch('api/chat-messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: request.message,
      chatId: request.chatId,
    }),
    ...init,
  });
  const { error: validationError } = validateResponse(result, [206]);
  error = validationError;

  const chatId = result.headers.get('X-Chat-ID');
  if (!chatId) {
    error = error ?? new Error('No chat ID returned from request.');
  }
  const chatMessageId = result.headers.get('X-Chat-Message-ID');
  if (!chatMessageId) {
    error = error ?? new Error('No chat message ID returned from request.');
  }

  const reader = result.body?.getReader();
  if (!reader) {
    error = error ?? new Error('No stream reader returned from request.');
  }

  if (readHandler) {
    await readHandler(reader!);
  }

  return {
    reader,
    chatId,
    chatMessageId,
    error,
  };
}

export async function getChatMessages(init?: RequestInit) {
  let error = undefined;
  const response = await fetch('/api/chat-messages', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
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
  const response = await fetch(`/api/chat-messages/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
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

export async function getChatMessageResult(id: string, init?: RequestInit) {
  let error = undefined;
  const response = await fetch(`/api/chat-messages/${id}/result`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...init,
  });
  const { error: valError } = validateResponse(response);
  error = valError;
  const data: ChatAnswer = await response.json();
  return {
    messageResult: data,
    error,
  };
}
