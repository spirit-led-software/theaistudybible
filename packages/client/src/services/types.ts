import type { Query } from '@revelationsai/core/database/helpers';

export type PaginatedEntitiesResponse<T> = {
  entities: T[];
  page: number;
  perPage: number;
};

export type SearchForEntitiesOptions = {
  query: Query;
};

export type PaginatedEntitiesOptions = {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
};

export type ProtectedApiOptions = {
  session: string;
};
