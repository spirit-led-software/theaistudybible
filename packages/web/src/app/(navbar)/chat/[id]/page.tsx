import { Window } from "@components/chat";
import { searchForAiResponses } from "@services/ai-response";
import { getChat, getChats } from "@services/chat";
import { validServerSession } from "@services/session";
import { isObjectOwner } from "@services/user";
import { searchForUserMessages } from "@services/user/message";
import { Message } from "ai/react";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getMessages(chatId: string, userId: string) {
  const { userMessages: foundUserMessages } = await searchForUserMessages({
    AND: [
      {
        eq: {
          column: "chatId",
          value: chatId,
        },
      },
      {
        eq: {
          column: "userId",
          value: userId,
        },
      },
    ],
  });

  const messages: Message[] = (
    await Promise.all(
      foundUserMessages.map(async (userMessage) => {
        const message: Message = {
          id: userMessage.aiId!,
          content: userMessage.text,
          role: "user",
        };

        const { aiResponses: foundAiResponses } = await searchForAiResponses({
          eq: {
            column: "userMessageId",
            value: userMessage.id,
          },
        });

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
    limit: 7,
  });

  const [messages, { chats }] = await Promise.all([
    messagesPromise,
    chatsPromise,
  ]);

  return (
    <Window initChats={chats} initChatId={params.id} initMessages={messages} />
  );
}
