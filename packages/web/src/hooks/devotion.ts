import { Devotion } from "@revelationsai/core/database/model";
import { useEffect, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import {
  entitiesFetcher,
  setOrderSearchParams,
  setPaginationSearchParams,
} from "./shared";

const devosFetcher = async (url: string): Promise<Devotion[]> => {
  return entitiesFetcher(url);
};

export const useDevotions = (
  initDevos?: Devotion[],
  options?: {
    limit?: number;
    page?: number;
    orderBy?: string;
    order?: string;
  },
  swrOptions?: SWRConfiguration
) => {
  const [devos, setDevos] = useState<Devotion[]>(initDevos ?? []);
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

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    `/api/devotions?${searchParams.toString()}`,
    devosFetcher,
    swrOptions
  );

  useEffect(() => {
    if (data) {
      setDevos(data);
    }
  }, [data]);

  return {
    devos,
    setDevos,
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
