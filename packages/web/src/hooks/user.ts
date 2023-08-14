import { UserWithRoles } from "@core/model";
import { validSession } from "@services/session";
import { useEffect, useState } from "react";
import { useClientSession } from "./session";

export const useUser = () => {
  const session = useClientSession();
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (session) {
      setIsLoading(true);
      validSession(session)
        .then(async ({ isValid, token, userInfo }) => {
          if (isValid) {
            setUser(userInfo);
          } else {
            setUser(null);
            setError(
              new Error(`Error getting user info using token: ${token}`)
            );
          }
          setIsLoading(false);
        })
        .catch((e) => {
          console.error(e);
          setError(new Error(e.message || "Error getting user info"));
          setIsLoading(false);
        });
    } else {
      setUser(null);
    }
  }, [session]);

  return {
    user,
    error,
    isLoading,
  };
};
