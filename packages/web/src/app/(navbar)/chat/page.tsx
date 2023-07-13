import { Window } from "@components/chat";
import { getChats } from "@services/chat";
import { validServerSession } from "@services/user";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const { isValid } = await validServerSession();
  if (!isValid) {
    redirect(`/login?redirect=/chat`);
  }

  const chats = await getChats({
    limit: 7,
  });

  return <Window initChats={chats} />;
}
