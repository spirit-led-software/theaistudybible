import { Window } from "@components/chat";
import { getChats } from "@core/services/chat";
import { isObjectOwner } from "@core/services/user";
import { validServerSession } from "@services/user";
import { headers } from "next/headers";

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const sessionToken = headers().get("Authorization");
  if (!sessionToken) redirect("/login?redirect=/chat");
  const { isValid, userInfo } = await validServerSession(sessionToken);
  if (!isValid) {
    redirect(`/login?redirect=/chat`);
  }

  const chats = await getChats({
    limit: 7,
  })
    .then((chats) => {
      return chats.filter((chat) => isObjectOwner(chat, userInfo.id));
    })
    .catch((error) => {
      throw new Error(error);
    });

  return <Window initChats={chats} />;
}
