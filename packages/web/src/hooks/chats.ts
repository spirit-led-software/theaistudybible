import { Chat } from "@prisma/client";
import useSWR from "swr";
import {
  entitiesFetcher,
  setOrderSearchParams,
  setPaginationSearchParams,
} from "./shared";

const chatsFetcher = async (url: string): Promise<Chat[]> => {
  return entitiesFetcher(url);
};

export const useChats = (options?: {
  limit: number;
  page: number;
  orderBy: string;
  order: string;
}) => {
  const { limit, page, orderBy, order } = options ?? {};
  let searchParams = new URLSearchParams();
  searchParams = setPaginationSearchParams(searchParams, {
    limit: limit,
    page: page,
  });
  searchParams = setOrderSearchParams(searchParams, {
    orderBy: orderBy,
    order: order,
  });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/chats?${searchParams.toString()}`,
    chatsFetcher
  );

  return {
    chats: data,
    error,
    isLoading,
    mutate,
  };
};
