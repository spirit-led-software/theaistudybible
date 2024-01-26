import type { UpdateUserData, User, UserInfo, UserWithRoles } from '@revelationsai/core/model/user';
import { GetEntitiesSearchParams } from '../helpers/search-params';
import type {
  PaginatedEntitiesOptions,
  PaginatedEntitiesResponse,
  ProtectedApiOptions,
  SearchForEntitiesOptions
} from '../types';
import apiConfig from '../../configs/api';

export async function getUserInfo(session: string) {
  const response = await fetch(`${apiConfig.url}/auth/user-info`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session}`
    }
  });

  if (!response.ok) {
    console.error(
      `Error retrieving current user. Received response: ${response.status} ${response.statusText}`
    );
    const data = await response.json();
    throw new Error(data.error || 'Error retrieving current user.');
  }

  const user: UserInfo = await response.json();

  return user;
}

export async function deleteUser(id: string, options: ProtectedApiOptions) {
  const response = await fetch(`${apiConfig.url}/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${options.session}`
    }
  });

  if (!response.ok) {
    console.error(
      `Error deleting user. Received response: ${response.status} ${response.statusText}`
    );
    const data = await response.json();
    throw new Error(data.error || 'Error deleting user.');
  }
}

export function isObjectOwner(object: { userId: string }, userId: string) {
  return object.userId === userId;
}

export function isAdmin(userInfo: UserWithRoles) {
  return userInfo.roles.some((role) => role.name === 'admin');
}

export function getUserMaxQueries(userInfo: UserWithRoles) {
  const queryPermissions: string[] = [];
  userInfo.roles.forEach((role) => {
    const queryPermission = role.permissions.find((permission) => {
      return permission.startsWith('query:');
    });
    if (queryPermission) queryPermissions.push(queryPermission);
  });
  return Math.max(10, ...queryPermissions.map((p) => parseInt(p.split(':')[1])));
}

export async function updateUser(
  id: string,
  request: UpdateUserData,
  options: ProtectedApiOptions
) {
  const response = await fetch(`${apiConfig.url}/users/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${options.session}`,
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    console.error(
      `Error updating user. Received response: ${response.status} ${response.statusText}`
    );
    const data = await response.json();
    throw new Error(data.error || 'Error updating user.');
  }

  const data = await response.json();
  return data;
}

export async function updatePassword(
  session: string,
  request: { currentPassword: string; newPassword: string }
) {
  const response = await fetch(`${apiConfig.url}/users/change-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session}`,
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    console.error(
      `Error updating password. Received response: ${response.status} ${response.statusText}`
    );
    const data = await response.json();
    throw new Error(data.error || 'Error updating password.');
  }
}

export async function uploadProfilePicture(file: File, session: string): Promise<string> {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    throw new Error('Invalid file type.');
  }

  const urlRequest = await fetch(`${apiConfig.url}/users/profile-pictures/presigned-url`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session}`,
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({
      fileType: file.type
    })
  });

  if (!urlRequest.ok) {
    throw new Error('Error getting presigned url.');
  }

  const data = await urlRequest.json();
  const url = new URL(data.url);

  const uploadRequest = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  });

  if (!uploadRequest.ok) {
    throw new Error('Error uploading profile picture.');
  }

  return url.toString().split('?')[0];
}

export async function getUsers(options: PaginatedEntitiesOptions & ProtectedApiOptions) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(`${apiConfig.url}/users?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${options.session}`
    }
  });

  if (!response.ok) {
    console.error(
      `Error retrieving users. Received response: ${response.status} ${response.statusText}`
    );
    const data = await response.json();
    throw new Error(data.error || 'Error retrieving users.');
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<User> = await response.json();

  return {
    users: entities,
    page,
    perPage
  };
}

export async function searchForUsers(
  options: SearchForEntitiesOptions & PaginatedEntitiesOptions & ProtectedApiOptions
) {
  const searchParams = GetEntitiesSearchParams(options);
  const response = await fetch(`${apiConfig.url}/users/search?${searchParams.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.session}`
    },
    body: JSON.stringify(options.query)
  });

  if (!response.ok) {
    console.error(
      `Error searching for users. Received response: ${response.status} ${response.statusText}`
    );
    const data = await response.json();
    throw new Error(data.error || 'Error searching for users.');
  }

  const { entities, page, perPage }: PaginatedEntitiesResponse<User> = await response.json();

  return {
    users: entities,
    page,
    perPage
  };
}

export async function getUser(id: string, options: ProtectedApiOptions) {
  const response = await fetch(`${apiConfig.url}/users/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${options.session}`
    }
  });

  if (!response.ok) {
    console.error(
      `Error retrieving user. Received response: ${response.status} ${response.statusText}`
    );
    const data = await response.json();
    throw new Error(data.error || 'Error retrieving user.');
  }

  const user: User = await response.json();

  return user;
}

export function hasPlus(userInfo: UserInfo) {
  return userInfo.roles.some((role) => role.name === 'rc:plus');
}
