import { Window } from "@components/chat";
import { AiResponse } from "@prisma/client";
import { getChat, getChats } from "@services/chat";
import { isObjectOwner, validServerSession } from "@services/user";
import { getUserMessages } from "@services/user-messages";
import { Message } from "ai/react";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getMessages(chatId: string) {
  const userMessages = await getUserMessages({
    query: {
      chatId,
    },
    include: {
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
      const aiResponses: Message[] = (userMessage as any).aiResponses.map(
        (aiResponse: AiResponse) => ({
          id: aiResponse.aiId,
          content: aiResponse.text,
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

  const { isValid, user } = await validServerSession();
  if (!isValid || !isObjectOwner(chat, user)) {
    redirect(`/login?redirect=/chat/${chat.id}`);
  }

  const messages = await getMessages(params.id);

  const chats = await getChats({
    limit: 7,
  })
    .then((chats) => {
      return chats.filter((chat) => isObjectOwner(chat, user));
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
