import { getDevotions } from "@core/services/devotion";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DevoPageRoot() {
  const devos = await getDevotions({
    limit: 1,
    offset: 0,
  });

  if (devos.length !== 0) {
    redirect(`/devotions/${devos[0].id}`);
  }

  return (
    <div className="flex flex-col justify-center w-full h-full text-xl font-extrabold place-items-center">
      Coming Soon!
    </div>
  );
}
