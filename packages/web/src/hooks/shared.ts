export type ProtectedApiHookParams = {
  url: string;
  token: string;
};

export const entitiesFetcher = async (
  url: string,
  token?: string
): Promise<any> => {
  let options: RequestInit = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  if (token) {
    options = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }
  const res = await fetch(url, options);
  const data = await res.json();
  const { entities } = data;
  return entities;
};

export const setPaginationSearchParams = (
  searchParams: URLSearchParams,
  options: { limit?: number; page?: number }
) => {
  const { limit, page } = options;
  if (limit) {
    searchParams.set("limit", limit.toString());
  }
  if (page) {
    searchParams.set("page", page.toString());
  }
  return searchParams;
};

export const setOrderSearchParams = (
  searchParams: URLSearchParams,
  options: { orderBy?: string; order?: string }
) => {
  const { orderBy, order } = options;
  if (orderBy) {
    searchParams.set("orderBy", orderBy);
  }
  if (order) {
    searchParams.set("order", order);
  }
  return searchParams;
};
