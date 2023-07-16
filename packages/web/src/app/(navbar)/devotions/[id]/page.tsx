import { db } from "@chatesv/core/database";
import { Window } from "@components/devotion";

export const dynamic = "force-dynamic";

export default async function DevoPage({ params }: { params: { id: string } }) {
  const devos = await db.query.devotions.findMany({
    with: {
      sourceDocuments: true,
    },
  });

  return <Window devos={devos} activeDevoId={params.id} />;
}
