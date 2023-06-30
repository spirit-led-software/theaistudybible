import { DevosClient } from "@/clients/devos";
import { redirect } from "next/navigation";

export default async function DevoPageRoot() {
  const devos = await new DevosClient().getDevos();
  redirect(`/devos/${devos[0].id}`);
}
