import {
  CreateDevoForm,
  DeleteDevoForm,
  FileIndexForm,
  IndexOperationsDashboard,
  WebsiteIndexForm,
} from "@components/admin";
import { WebpageIndexForm } from "@components/admin/WebpageIndexForm";
import { getIndexOperations } from "@services/index-op";
import { getSessionTokenFromCookies } from "@services/server-only/session";
import { isAdmin, validSession } from "@services/session";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const { isValid, userInfo, token } = await validSession(
    getSessionTokenFromCookies()
  );
  if (!isValid || !isAdmin(userInfo)) {
    redirect("/");
  }

  const { indexOperations: indexOps } = await getIndexOperations({
    token,
    limit: 100,
  });

  return (
    <div className="flex w-full h-full p-5 bg-white lg:w-1/2">
      <div className="flex flex-col w-full space-y-10 overflow-y-scroll">
        <IndexOperationsDashboard initIndexOps={indexOps} />
        <FileIndexForm />
        <WebpageIndexForm />
        <WebsiteIndexForm />
        <CreateDevoForm />
        <DeleteDevoForm />
      </div>
    </div>
  );
}
