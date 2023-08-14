import { Chat } from "@core/model";
import { getChats } from "@services/chat";
import { PaginatedEntitiesOptions } from "@services/types";
import { useEffect, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { useClientSession } from "./session";

export const useChats = (
  initChats?: Chat[],
  options?: PaginatedEntitiesOptions,
  swrOptions?: SWRConfiguration
) => {
  const session = useClientSession();
  const [chats, setChats] = useState<Chat[]>(initChats ?? []);
  const [limit, setLimit] = useState<number>(options?.limit ?? 25);
  const [page, setPage] = useState<number>(options?.page ?? 1);
  const { orderBy = "createdAt", order = "desc" } = options ?? {};

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    {
      session,
      limit,
      page,
      orderBy,
      order,
    },
    ({ session, limit, page, order, orderBy }) =>
      getChats({
        token: session!,
        limit,
        page,
        orderBy,
        order,
      }).then(({ chats }) => chats),
    swrOptions
  );

  useEffect(() => {
    if (data) {
      setChats(data);
    }
  }, [data]);

  return {
    chats,
    setChats,
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
