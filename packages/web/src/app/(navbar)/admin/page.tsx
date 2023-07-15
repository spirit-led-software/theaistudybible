import {
  CreateDevoForm,
  DeleteDevoForm,
  FileIndexForm,
  IndexOperationsDashboard,
  WebsiteIndexForm,
} from "@components/admin";
import { getIndexOperations } from "@core/services/index-op";

export default async function AdminPage() {
  const indexOps = await getIndexOperations({
    orderBy: { createdAt: "desc" },
    limit: 100,
  });
  return (
    <div className="flex w-full h-full p-5 bg-white lg:w-1/2">
      <div className="flex flex-col w-full space-y-10 overflow-y-scroll">
        <IndexOperationsDashboard initIndexOps={indexOps} />
        <FileIndexForm />
        <WebsiteIndexForm />
        <CreateDevoForm />
        <DeleteDevoForm />
      </div>
    </div>
  );
}
