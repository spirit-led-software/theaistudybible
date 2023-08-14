import { cookies } from "next/headers";

export function getSessionTokenFromCookies() {
  const sessionToken = cookies().get("session");
  return sessionToken?.value;
}
