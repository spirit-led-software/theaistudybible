import { Window } from "@components/devotion";
import {
  getDevotionImagesByDevotionId,
  getDevotionReactionCounts,
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
  if (!activeDevo) {
    redirect("/devotions");
  }

  const sourceDocsPromise = getDevotionRelatedSourceDocuments(activeDevo);
  const imagesPromise = getDevotionImagesByDevotionId(activeDevo.id);
  const reactionCountsPromise = getDevotionReactionCounts(activeDevo.id);

  const [sourceDocs, images, reactionCounts] = await Promise.all([
    sourceDocsPromise,
    imagesPromise,
    reactionCountsPromise,
  ]);

  return (
    <Window
      devos={devos}
      activeDevo={activeDevo}
      sourceDocuments={sourceDocs}
      images={images}
      reactionCounts={reactionCounts}
    />
  );
}
