import { SessionContext } from "@components/SessionProvider";
import { useContext } from "react";

export const useSession = () => {
  const { session, setSession } = useContext(SessionContext);

  return {
    session,
    setSession,
  };
};
