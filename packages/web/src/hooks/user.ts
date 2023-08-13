import { apiConfig } from "@configs/index";
import { User } from "@core/model";
import { useEffect, useState } from "react";
import { useSession } from "./session";

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useSession();

  useEffect(() => {
    if (session) {
      setIsLoading(true);
      fetch(`${apiConfig.url}/session`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session}`,
        },
      })
        .then((r) => {
          if (r.status === 200) {
            r.json().then((u) => setUser(u));
          }
          setIsLoading(false);
        })
        .catch((e) => {
          console.error(e);
          setIsLoading(false);
        });
    } else {
      setUser(null);
    }
  }, [session]);

  return {
    user,
    isLoading,
  };
};
