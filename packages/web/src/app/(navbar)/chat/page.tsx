import { Window } from "@components/chat";
import { getChats } from "@core/services/chat";
import { chats as chatsTable } from "@revelationsai/core/database/schema";
import { validServerSession } from "@services/user";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const { isValid, userInfo } = await validServerSession();
  if (!isValid) {
    redirect(`/login?redirect=/chat`);
  }

  const chats = await getChats({
    where: eq(chatsTable.userId, userInfo.id),
    limit: 7,
  });

  return <Window initChats={chats} />;
}
