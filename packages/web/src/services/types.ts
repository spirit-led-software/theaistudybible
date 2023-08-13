export type EntitiesResponse<T> = {
  entities: T[];
  page: number;
  perPage: number;
};

export type GetEntitiesOptions = {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: "asc" | "desc";
};
