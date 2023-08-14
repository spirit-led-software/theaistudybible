import { IndexOperation } from "@core/model";
import { getIndexOperations } from "@services/index-op";
import { PaginatedEntitiesOptions } from "@services/types";
import { useEffect, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { useClientSession } from "./session";

export const useIndexOps = (
  initIndexOps?: IndexOperation[],
  options?: PaginatedEntitiesOptions,
  swrOptions?: SWRConfiguration
) => {
  const session = useClientSession();
  const [indexOps, setIndexOps] = useState<IndexOperation[]>(
    initIndexOps ?? []
  );
  const [limit, setLimit] = useState<number>(options?.limit ?? 10);
  const [page, setPage] = useState<number>(options?.page ?? 1);
  const { orderBy = "createdAt", order = "desc" } = options ?? {};

  const { data, error, mutate, isLoading, isValidating } = useSWR(
    {
      session,
      limit,
      page,
      orderBy,
      order,
    },
    ({ session, limit, page, orderBy, order }) =>
      getIndexOperations({
        token: session!,
        limit,
        page,
        orderBy,
        order,
      }).then(({ indexOperations }) => indexOperations),
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
