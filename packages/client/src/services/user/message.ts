import type { UserMessage } from '@revelationsai/core/model/user/message';
import { GetEntitiesSearchParams } from '../helpers/search-params';
import type {
  PaginatedEntitiesOptions,
  PaginatedEntitiesResponse,
  ProtectedApiOptions,
  SearchForEntitiesOptions
} from '../types';
import apiConfig from '../../configs/api';

export async function getUserMessages(options: PaginatedEntitiesOptions & ProtectedApiOptions) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(`${apiConfig.url}/user-messages?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${options.session}`
    }
  });

  if (!response.ok) {
    console.error(`Error retrieving user messages. Received response:`, JSON.stringify(response));
    const data = await response.json();
    throw new Error(data.error || 'Error retrieving user messages.');
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<UserMessage> = await response.json();

  return {
    userMessages: entities,
    page,
    perPage
  };
}

export async function getUserMessage(id: string, options: ProtectedApiOptions) {
  const response = await fetch(`${apiConfig.url}/user-messages/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${options.session}`
    }
  });

  if (!response.ok) {
    console.error(`Error retrieving user message. Received response:`, JSON.stringify(response));
    const data = await response.json();
    throw new Error(data.error || 'Error retrieving user message.');
  }

  const userMessage: UserMessage = await response.json();

  return userMessage;
}

export async function searchForUserMessages(
  options: SearchForEntitiesOptions & PaginatedEntitiesOptions & ProtectedApiOptions
) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(`${apiConfig.url}/user-messages/search?${searchParams.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.session}`
    },
    body: JSON.stringify(options.query)
  });

  if (!response.ok) {
    console.error(
      `Error searching for user messages. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || 'Error searching for user messages.');
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<UserMessage> = await response.json();

  return {
    userMessages: entities,
    page,
    perPage
  };
}
