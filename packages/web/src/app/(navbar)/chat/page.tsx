import { Window } from "@components/chat";
import { getChats } from "@core/services/chat";
import { isObjectOwner } from "@core/services/user";
import { validServerSession } from "@services/user";

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const { isValid, userId } = await validServerSession();
  if (!isValid) {
    redirect(`/login?redirect=/chat`);
  }

  const chats = await getChats({
    limit: 7,
  })
    .then((chats) => {
      return chats.filter((chat) => isObjectOwner(chat, userId));
    })
    .catch((error) => {
      throw new Error(error);
    });

  return <Window initChats={chats} />;
}
