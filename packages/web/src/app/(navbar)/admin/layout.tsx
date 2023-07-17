import { isAdmin } from "@core/services/user";
import { validServerSession } from "@services/user";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionToken = headers().get("Authorization");
  if (!sessionToken) redirect("/");

  const { isValid, userInfo } = await validServerSession(sessionToken);
  if (!isValid || !(await isAdmin(userInfo.id))) {
    redirect("/");
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-slate-200 place-items-center">
      {children}
    </div>
  );
}
