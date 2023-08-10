import { Window } from "@components/chat";
import { getAiResponsesByUserMessageId } from "@core/services/ai-response";
import { getChat, getChats } from "@core/services/chat";
import { isObjectOwner } from "@core/services/user";
import { getUserMessages } from "@core/services/user-message";
import {
  chats as chatsTable,
  userMessages,
} from "@revelationsai/core/database/schema";
import { validServerSession } from "@services/user";
import { Message } from "ai/react";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getMessages(chatId: string, userId: string) {
  const foundUserMessages = await getUserMessages({
    where: and(
      eq(userMessages.chatId, chatId),
      eq(userMessages.userId, userId)
    ),
  });

  const messages: Message[] = (
    await Promise.all(
      foundUserMessages.map(async (userMessage) => {
        const message: Message = {
          id: userMessage.aiId!,
          content: userMessage.text,
          role: "user",
        };

        const foundAiResponses = await getAiResponsesByUserMessageId(
          userMessage.id
        );

        const responses: Message[] = foundAiResponses
          .filter((aiResponse) => !aiResponse.failed && !aiResponse.regenerated)
          .map((aiResponse) => ({
            id: aiResponse.aiId!,
            content: aiResponse.text!,
            role: "assistant",
          }));
        return [responses[0], message];
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

  const messagesPromise = getMessages(params.id, userInfo.id);
  const chatsPromise = getChats({
    where: eq(chatsTable.userId, userInfo.id),
    limit: 7,
  });

  const [messages, chats] = await Promise.all([messagesPromise, chatsPromise]);

  return (
    <Window initChats={chats} initChatId={params.id} initMessages={messages} />
  );
}
