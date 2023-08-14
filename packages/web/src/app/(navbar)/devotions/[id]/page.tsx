import { Window } from "@components/devotion";
import {
  getDevotion,
  getDevotionImages,
  getDevotionReactionCounts,
  getDevotionSourceDocuments,
  getDevotions,
} from "@services/devotion";

export const dynamic = "force-dynamic";

export default async function DevoPage({ params }: { params: { id: string } }) {
  const { devotions: devos } = await getDevotions({
    limit: 7,
  });

  const activeDevo = await getDevotion(params.id);
  const sourceDocsPromise = getDevotionSourceDocuments(activeDevo.id);
  const imagesPromise = getDevotionImages(activeDevo.id);
  const reactionCountsPromise = getDevotionReactionCounts(activeDevo.id);

  const [sourceDocs, { images }, reactionCounts] = await Promise.all([
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
