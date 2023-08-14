import { SessionContext } from "@components/SessionProvider";
import { useContext } from "react";

export const useClientSession = () => {
  const { session } = useContext(SessionContext);

  return session;
};
