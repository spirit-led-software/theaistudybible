import { SessionContext } from "@components/SessionProvider";
import { useContext } from "react";

export const useSession = () => {
  const { session } = useContext(SessionContext);

  return {
    session,
  };
};
