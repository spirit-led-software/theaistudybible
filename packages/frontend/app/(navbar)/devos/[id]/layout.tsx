import { DevoClient } from "@/clients/devo";
import { Sidebar } from "@/components/devo";

export default async function DevoPageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const devos = await new DevoClient().getDevos();
  return (
    <div className="flex flex-row-reverse flex-1 h-full max-w-full">
      <Sidebar activeDevoId={params.id} devos={devos} />
      {children}
    </div>
  );
}
