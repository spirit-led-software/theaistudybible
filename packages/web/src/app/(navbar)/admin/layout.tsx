import { isAdmin, validServerSession } from "@services/user";
import { redirect } from "next/navigation";

export default async function AdminPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isValid, user } = await validServerSession();
  if (!isValid || !(await isAdmin(user.id))) {
    redirect("/");
  }
  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-slate-200 place-items-center">
      {children}
    </div>
  );
}
