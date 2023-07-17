import {
  CreateDevoForm,
  DeleteDevoForm,
  FileIndexForm,
  IndexOperationsDashboard,
  WebsiteIndexForm,
} from "@components/admin";
import { WebpageIndexForm } from "@components/admin/WebpageIndexForm";
import { getIndexOperations } from "@core/services/index-op";
import { isAdmin } from "@core/services/user";
import { validServerSession } from "@services/user";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const { isValid, userInfo } = await validServerSession();
  if (!isValid || !(await isAdmin(userInfo.id))) {
    redirect("/");
  }

  const indexOps = await getIndexOperations({
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
