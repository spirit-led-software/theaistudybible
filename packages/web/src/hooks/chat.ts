import { apiConfig } from "@configs/index";
import { Chat } from "@revelationsai/core/database/model";
import { useEffect, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { useSession } from "./session";
import {
  ProtectedApiHookParams,
  entitiesFetcher,
  setOrderSearchParams,
  setPaginationSearchParams,
} from "./shared";

const chatsFetcher = async ({
  url,
  token,
}: ProtectedApiHookParams): Promise<Chat[]> => {
  return entitiesFetcher(url, token);
};

export const useChats = (
  initChats?: Chat[],
  options?: {
    limit?: number;
    page?: number;
    orderBy?: string;
    order?: string;
  },
  swrOptions?: SWRConfiguration
) => {
  const { session } = useSession();
  const [chats, setChats] = useState<Chat[]>(initChats ?? []);
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
    {
      url: `${apiConfig.url}/chats?${searchParams.toString()}`,
      token: session,
    },
    chatsFetcher,
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
