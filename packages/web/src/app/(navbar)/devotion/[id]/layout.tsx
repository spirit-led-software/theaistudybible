import { prisma } from "@/services/database";
import { Sidebar } from "@components/devo";

async function getDevos() {
  const devos = await prisma.devotion.findMany({
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
