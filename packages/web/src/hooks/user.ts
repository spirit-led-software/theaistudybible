import { User } from "@chatesv/core/database/model";
import { apiConfig } from "@configs/index";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useSession } from "./session";

const fetcher = ([url, token]: [string, string]): Promise<User> =>
  fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((r) => r.json());

export const useUser = () => {
  const { session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [`${apiConfig.url}/session`, session],
    fetcher
  );

  useEffect(() => {
    mutate();
  }, [session, mutate]);

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  return {
    user,
    setUser,
    isLoading,
    isValidating,
    error,
    mutate,
  };
};
