import { Window } from "@components/chat";
import { getAiResponses } from "@core/services/ai-response";
import { getChat, getChats } from "@core/services/chat";
import { isObjectOwner } from "@core/services/user";
import { getUserMessages } from "@core/services/user-message";
import { aiResponses, userMessages } from "@revelationsai/core/database/schema";
import { validServerSession } from "@services/user";
import { Message } from "ai/react";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getMessages(chatId: string) {
  const foundUserMessages = await getUserMessages({
    where: eq(userMessages.chatId, chatId),
  });

  const messages: Message[] = (
    await Promise.all(
      foundUserMessages.map(async (userMessage) => {
        const message: Message = {
          id: userMessage.aiId!,
          content: userMessage.text,
          role: "user",
        };

        const foundAiResponses = await getAiResponses({
          where: eq(aiResponses.userMessageId, userMessage.id),
        });

        const responses: Message[] = foundAiResponses.map((aiResponse) => ({
          id: aiResponse.aiId!,
          content: aiResponse.text!,
          role: "assistant",
        }));
        return [...responses, message];
      })
    )
  )
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

  const { isValid, userInfo } = await validServerSession();
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
