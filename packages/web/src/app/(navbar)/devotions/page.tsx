import { getDevotions } from "@services/devotion";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DevoPageRoot() {
  const devos = await getDevotions({
    limit: 1,
    offset: 0,
    orderBy: {
      createdAt: "desc",
    },
  });

  if (devos.length !== 0) {
    redirect(`/devotions/${devos[0].id}`);
  }

  return <div>Coming Soon!</div>;
}