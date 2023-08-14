import { Window } from "@components/chat";
import { aiResponses, userMessages } from "@core/schema";
import { getPropertyName } from "@revelationsai/core/util/object";
import { searchForAiResponses } from "@services/ai-response";
import { getChat, getChats } from "@services/chat";
import { getSessionTokenFromCookies } from "@services/server-only/session";
import { validSession } from "@services/session";
import { searchForUserMessages } from "@services/user/message";
import { Message } from "ai/react";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getMessages(token: string, chatId: string, userId: string) {
  const { userMessages: foundUserMessages } = await searchForUserMessages({
    token,
    query: {
      AND: [
        {
          eq: {
            column: getPropertyName(
              userMessages,
              (userMessages) => userMessages.chatId
            ),
            value: chatId,
          },
        },
        {
          eq: {
            column: getPropertyName(
              userMessages,
              (userMessages) => userMessages.userId
            ),
            value: userId,
          },
        },
      ],
    },
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
          token,
          query: {
            eq: {
              column: getPropertyName(
                aiResponses,
                (aiResponses) => aiResponses.userMessageId
              ),
              value: userMessage.id,
            },
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
  const { isValid, userInfo, token } = await validSession(
    getSessionTokenFromCookies()
  );
  if (!isValid) {
    redirect(`/login?redirect=/chat/${params.id}`);
  }

  const chat = await getChat(params.id, {
    token,
  });
  if (!chat) {
    notFound();
  }

  const messagesPromise = getMessages(token, params.id, userInfo.id);
  const chatsPromise = getChats({
    token,
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
