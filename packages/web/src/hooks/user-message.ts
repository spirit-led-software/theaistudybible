import { UserMessage } from "@revelationsai/core/database/model";
import useSWR from "swr";
import { useSession } from "./session";
import {
  ProtectedApiHookParams,
  entitiesFetcher,
  setOrderSearchParams,
  setPaginationSearchParams,
} from "./shared";

const messagesFetcher = async ({
  url,
  token,
}: ProtectedApiHookParams): Promise<UserMessage> => {
  return entitiesFetcher(url, token);
};

export const useUserMessages = (options?: {
  chatId: string;
  limit: number;
  page: number;
  orderBy: string;
  order: string;
}) => {
  const { session } = useSession();
  const { chatId, limit, page, orderBy, order } = options ?? {};
  let searchParams = new URLSearchParams();
  searchParams = setPaginationSearchParams(searchParams, {
    limit: limit,
    page: page,
  });
  searchParams = setOrderSearchParams(searchParams, {
    orderBy: orderBy,
    order: order,
  });
  if (chatId) {
    searchParams.set("chatId", chatId);
  }

  const { data, error, isLoading, mutate } = useSWR(
    { url: `/api/user-messages?${searchParams.toString()}`, token: session },
    messagesFetcher
  );

  return {
    messages: data,
    error,
    isLoading,
    mutate,
  };
};

export const useUserMessage = (messageId: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/user-messages/${messageId}`,
    messagesFetcher
  );

  return {
    message: data,
    error,
    isLoading,
    mutate,
  };
};
