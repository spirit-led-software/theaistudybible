import { Window } from "@components/chat";
import { getChats } from "@services/chat";
import { isObjectOwner, validServerSession } from "@services/user";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const { isValid, user } = await validServerSession();
  if (!isValid) {
    redirect(`/login?redirect=/chat`);
  }

  let chats = await getChats({
    limit: 7,
  });
  chats = chats.filter(async (chat) => isObjectOwner(chat, user));

  return <Window initChats={chats} />;
}
