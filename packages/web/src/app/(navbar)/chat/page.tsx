import { Window } from "@components/chat";
import { validServerSession } from "@services/user";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const { isValid } = await validServerSession();
  if (!isValid) {
    redirect(`/login?redirect=/chat`);
  }

  return <Window />;
}
