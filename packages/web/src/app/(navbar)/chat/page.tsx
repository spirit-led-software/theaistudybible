import { Window } from "@components/chat";
import { getChats } from "@services/chat";
import { validServerSession } from "@services/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const { isValid } = await validServerSession();
  if (!isValid) {
    redirect(`/login?redirect=/chat`);
  }

  const { chats } = await getChats({
    limit: 7,
  });

  return <Window initChats={chats} />;
}
