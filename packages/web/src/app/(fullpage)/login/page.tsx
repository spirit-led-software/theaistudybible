import { LoginWindow } from "@components/auth";
import { getSessionTokenFromCookies } from "@services/server-only/session";
import { validSession } from "@services/session";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const redirectPath = searchParams.redirect ?? "/";
  const { isValid } = await validSession(getSessionTokenFromCookies());
  if (isValid) {
    redirect(redirectPath);
  }

  return <LoginWindow />;
}
