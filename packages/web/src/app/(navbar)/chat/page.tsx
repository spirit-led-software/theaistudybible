import { Window } from "@components/chat";
import { getChats } from "@services/chat";
import { getSessionTokenFromCookies } from "@services/server-only/session";
import { validSession } from "@services/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const { isValid, token } = await validSession(getSessionTokenFromCookies());
  if (!isValid) {
    redirect(`/login?redirect=/chat`);
  }

  const { chats } = await getChats({
    token,
    limit: 7,
  });

  return <Window initChats={chats} />;
}
