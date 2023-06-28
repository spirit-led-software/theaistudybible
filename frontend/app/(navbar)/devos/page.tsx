import { DevoClient } from "@/clients/devo";
import { redirect } from "next/navigation";

export default async function DevoPageRoot() {
  const devos = await new DevoClient().getDevos();
  redirect(`/devos/${devos[0].id}`);
}
