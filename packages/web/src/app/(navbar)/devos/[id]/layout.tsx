import { Sidebar } from "@components/devo";
import { prisma } from "@server/database";
import type { Devo } from "@types";

async function getDevos() {
  const devos: Devo[] = await prisma.devo.findMany({
    take: 25,
    skip: 0,
    orderBy: {
      createdAt: "desc",
    },
  });
  return devos;
}

export default async function DevoPageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const devos = await getDevos();
  return (
    <div className="flex flex-row flex-1 h-full max-w-full">
      <Sidebar activeDevoId={params.id} devos={devos} />
      {children}
    </div>
  );
}
