import { Window } from "@components/devotion";
import {
  getDevotionRelatedSourceDocuments,
  getDevotions,
} from "@core/services/devotion";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DevoPage({ params }: { params: { id: string } }) {
  const devos = await getDevotions({
    limit: 7,
  });

  const activeDevo = devos.find((devo) => devo.id === params.id);
  if (!activeDevo) redirect("/devotions");

  const sourceDocs = await getDevotionRelatedSourceDocuments(activeDevo);

  return (
    <Window
      devos={devos}
      activeDevo={activeDevo}
      sourceDocuments={sourceDocs}
    />
  );
}
