import { LoginWindow } from "@components/auth";
import { validServerSession } from "@services/session";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const redirectPath = searchParams.redirect ?? "/";
  const { isValid } = await validServerSession();
  if (isValid) {
    redirect(redirectPath);
  }

  return <LoginWindow />;
}
