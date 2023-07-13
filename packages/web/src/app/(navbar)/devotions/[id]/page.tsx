import { Window } from "@components/devotion";
import { getDevotions } from "@services/devotion";

export const dynamic = "force-dynamic";

export default async function DevoPage({ params }: { params: { id: string } }) {
  const devos = await getDevotions({
    limit: 25,
    offset: 0,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sourceDocuments: true,
    },
  });

  return <Window devos={devos} activeDevoId={params.id} />;
}
