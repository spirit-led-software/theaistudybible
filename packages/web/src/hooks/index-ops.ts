import { apiConfig } from "@configs/index";
import { IndexOperation } from "@revelationsai/core/database/model";
import { useEffect, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { useSession } from "./session";
import {
  ProtectedApiHookParams,
  entitiesFetcher,
  setOrderSearchParams,
  setPaginationSearchParams,
} from "./shared";

const indexOpsFetcher = async ({
  url,
  token,
}: ProtectedApiHookParams): Promise<IndexOperation[]> => {
  return entitiesFetcher(url, token);
};

export const useIndexOps = (
  initIndexOps?: IndexOperation[],
  options?: {
    limit?: number;
    page?: number;
    orderBy?: string;
    order?: string;
  },
  swrOptions?: SWRConfiguration
) => {
  const { session } = useSession();
  const [indexOps, setIndexOps] = useState<IndexOperation[]>(
    initIndexOps ?? []
  );
  const [limit, setLimit] = useState<number>(options?.limit ?? 10);
  const [page, setPage] = useState<number>(options?.page ?? 1);
  const { orderBy = "createdAt", order = "desc" } = options ?? {};

  let searchParams = new URLSearchParams();
  searchParams = setPaginationSearchParams(searchParams, {
    limit: limit,
    page: page,
  });
  searchParams = setOrderSearchParams(searchParams, {
    orderBy: orderBy,
    order: order,
  });

  const { data, error, mutate, isLoading, isValidating } = useSWR(
    {
      url: `${apiConfig.url}/index-operations?${searchParams.toString()}`,
      token: session,
    },
    indexOpsFetcher,
    swrOptions
  );

  useEffect(() => {
    if (data) {
      setIndexOps(data);
    }
  }, [data]);

  return {
    indexOps,
    error,
    isLoading,
    isValidating,
    mutate,
    limit,
    setLimit,
    page,
    setPage,
  };
};
