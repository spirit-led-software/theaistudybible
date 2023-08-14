import { apiConfig } from "@configs";
import { User } from "@core/model";
import { GetEntitiesSearchParams } from "@services/helpers/search-params";
import {
  PaginatedEntitiesOptions,
  PaginatedEntitiesResponse,
} from "@services/types";

export async function getUsers(options: PaginatedEntitiesOptions) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(
    `${apiConfig.url}/users?${searchParams.toString()}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    console.error(
      `Error retrieving users. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || `Error retrieving users`);
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<User> =
    await response.json();

  return {
    users: entities,
    page,
    perPage,
  };
}

export async function getUser(id: string) {
  const response = await fetch(`${apiConfig.url}/users/${id}`, {
    method: "GET",
  });

  if (!response.ok) {
    console.error(
      `Error retrieving user with id ${id}. Received response:`,
      JSON.stringify(response)
    );
    const data = await response.json();
    throw new Error(data.error || `Error retrieving user with id ${id}`);
  }

  const user: User = await response.json();

  return user;
}

export function isObjectOwner(object: { userId: string }, userId: string) {
  return object.userId === userId;
}
