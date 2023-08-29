import { apiConfig } from "@config";
import type { UserWithRoles } from "@core/database/model";

export async function getUserInfo(session: string) {
  const response = await fetch(`${apiConfig.url}/session`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session}`,
    },
  });

  if (!response.ok) {
    console.error(
      `Error retrieving current user. Received response: ${response.status} ${response.statusText}`
    );
    const data = await response.json();
    throw new Error(data.error || "Error retrieving current user.");
  }

  const user: UserWithRoles = await response.json();

  return user;
}

export function isObjectOwner(object: { userId: string }, userId: string) {
  return object.userId === userId;
}

export function isAdmin(userInfo: UserWithRoles) {
  return userInfo.roles.some((role) => role.name === "admin");
}

export function getUserMaxQueries(userInfo: UserWithRoles) {
  const queryPermissions: string[] = [];
  userInfo.roles.forEach((role) => {
    const queryPermission = role.permissions.find((permission) => {
      return permission.startsWith("query:");
    });
    if (queryPermission) queryPermissions.push(queryPermission);
  });
  return Math.max(
    10,
    ...queryPermissions.map((p) => parseInt(p.split(":")[1]))
  );
}
