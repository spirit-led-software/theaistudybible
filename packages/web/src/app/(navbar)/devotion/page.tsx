import { prisma } from "@/services/database";
import { redirect } from "next/navigation";

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

export default async function DevoPageRoot() {
  const devos = await getDevos();

  if (devos.length !== 0) {
    redirect(`/devos/${devos[0].id}`);
  }

  return <div>Coming Soon!</div>;
}
