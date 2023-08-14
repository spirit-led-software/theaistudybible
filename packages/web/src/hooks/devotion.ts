import { Devotion } from "@core/model";
import { getDevotions } from "@services/devotion";
import { PaginatedEntitiesOptions } from "@services/types";
import { useEffect, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";

export const useDevotions = (
  key?: any,
  initDevos?: Devotion[],
  options?: PaginatedEntitiesOptions,
  swrOptions?: SWRConfiguration
) => {
  const [devos, setDevos] = useState<Devotion[]>(initDevos ?? []);
  const [limit, setLimit] = useState<number>(options?.limit ?? 10);
  const [page, setPage] = useState<number>(options?.page ?? 1);
  const { orderBy = "createdAt", order = "desc" } = options ?? {};

  if (!key) {
    key = options;
  }

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    key,
    () =>
      getDevotions({
        limit,
        page,
        orderBy,
        order,
      }).then(({ devotions }) => devotions),
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
