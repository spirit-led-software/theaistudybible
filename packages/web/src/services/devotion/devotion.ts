import { apiConfig } from "@configs";
import { Devotion, SourceDocument } from "@core/model";
import { GetEntitiesSearchParams } from "@services/helpers/search-params";
import {
  PaginatedEntitiesOptions,
  PaginatedEntitiesResponse,
} from "@services/types";

export async function getDevotions(options: PaginatedEntitiesOptions) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/devotions?${searchParams.toString()}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    console.error(
      "Error retrieving devotions. Received response:",
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || "Error retrieving devotions");
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<Devotion> =
    await response.json();

  return {
    devotions: entities,
    page,
    perPage,
  };
}

export async function getDevotion(id: string) {
  const response = await fetch(`${apiConfig.url}/devotions/${id}`, {
    method: "GET",
  });

  if (!response.ok) {
    console.error(
      `Error retrieving devotion with id ${id}. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || `Error retrieving devotion with id ${id}`);
  }

  const devotion: Devotion = await response.json();

  return devotion;
}

export async function getDevotionSourceDocuments(id: string) {
  const response = await fetch(
    `${apiConfig.url}/devotions/${id}/source-documents`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving source documents for devotion with id ${id}. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(
      data.error ||
        `Error retrieving source documents for devotion with id ${id}`
    );
  }

  const sourceDocuments: SourceDocument[] = await response.json();

  return sourceDocuments;
}
