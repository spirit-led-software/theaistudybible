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

  const chats = await getChats({
    limit: 7,
  })
    .then((chats) => {
      return chats.filter((chat) => isObjectOwner(chat, user));
    })
    .catch((error) => {
      throw new Error(error);
    });

  return <Window initChats={chats} />;
}
