import { db } from "@chatesv/core/database";
import { userMessages as userMessagesTable } from "@chatesv/core/database/schema";
import { Window } from "@components/chat";
import { getChat, getChats } from "@core/services/chat";
import { isObjectOwner } from "@core/services/user";
import { validServerSession } from "@services/user";
import { Message } from "ai/react";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getMessages(chatId: string) {
  const userMessages = await db.query.userMessages.findMany({
    where: eq(userMessagesTable.chatId, chatId),
    with: {
      aiResponses: true,
    },
  });

  const messages: Message[] = userMessages
    .map((userMessage) => {
      const message: Message = {
        id: userMessage.aiId!,
        content: userMessage.text,
        role: "user",
      };
      const aiResponses: Message[] = userMessage.aiResponses.map(
        (aiResponse) => ({
          id: aiResponse.aiId!,
          content: aiResponse.text!,
          role: "assistant",
        })
      );
      return [...aiResponses, message];
    })
    .flat()
    .reverse();

  return messages;
}

export default async function SpecificChatPage({
  params,
}: {
  params: { id: string };
}) {
  const chat = await getChat(params.id);
  if (!chat) {
    notFound();
  }

  const sessionToken = headers().get("Authorization");
  if (!sessionToken) redirect(`/login?redirect=/chat/${chat.id}`);

  const { isValid, userInfo } = await validServerSession(sessionToken);
  if (!isValid || !isObjectOwner(chat, userInfo.id)) {
    redirect(`/login?redirect=/chat/${chat.id}`);
  }

  const messages = await getMessages(params.id);

  const chats = await getChats({
    limit: 7,
  })
    .then((chats) => {
      return chats.filter((chat) => isObjectOwner(chat, userInfo.id));
    })
    .catch((error) => {
      throw new Error(error);
    });

  return (
    <Window
      initChats={chats}
      initChatId={params.id}
      initialMessages={messages}
    />
  );
}
