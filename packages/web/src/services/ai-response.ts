import { apiConfig } from "@configs";
import { AiResponse, SourceDocument } from "@core/model";
import { GetEntitiesSearchParams } from "./helpers/search-params";
import {
  PaginatedEntitiesOptions,
  PaginatedEntitiesResponse,
  ProtectedApiOptions,
  SearchForEntitiesOptions,
} from "./types";

export async function getAiResponses(
  options: PaginatedEntitiesOptions & ProtectedApiOptions
) {
  const token = options.token;
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

  const { entities, page, perPage }: PaginatedEntitiesResponse<AiResponse> =
    await response.json();

  return {
    aiResponses: entities,
    page,
    perPage,
  };
}

export async function getAiResponse(id: string, options: ProtectedApiOptions) {
  const token = options.token;
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
  options: SearchForEntitiesOptions &
    PaginatedEntitiesOptions &
    ProtectedApiOptions
) {
  const token = options.token;
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/ai-responses/search?${searchParams.toString()}`,
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
      `Error searching for AI responses. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || "Error searching for AI responses.");
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<AiResponse> =
    await response.json();

  return {
    aiResponses: entities,
    page,
    perPage,
  };
}

export async function getAiResponseSourceDocuments(
  id: string,
  options: ProtectedApiOptions
) {
  const response = await fetch(
    `${apiConfig.url}/ai-responses/${id}/source-documents`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${options.token}`,
      },
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving source documents for AI response with id ${id}. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(
      data.error ||
        `Error retrieving source documents for AI response with id ${id}`
    );
  }

  const sourceDocuments: SourceDocument[] = await response.json();

  return sourceDocuments;
}
