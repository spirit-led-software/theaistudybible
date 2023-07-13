import { CreateDevoForm } from "@components/admin/CreateDevoForm";
import { FileIndexForm } from "@components/admin/FileIndexForm";
import { IndexOperationsDashboard } from "@components/admin/IndexOperationsDashboard";
import { WebsiteIndexForm } from "@components/admin/WebsiteIndexForm";
import { getIndexOperations } from "@services/index-op";

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
      </div>
    </div>
  );
}
