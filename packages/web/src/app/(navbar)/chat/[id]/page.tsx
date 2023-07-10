import { prisma } from "@/services/database";
import { Sidebar, Window } from "@components/chat";
import { Message } from "ai/react";

async function getMessages(chatId: string) {
  const userMessages = await prisma.userMessage.findMany({
    where: {
      chatId,
    },
    include: {
      aiResponses: true,
    },
  });

  const messages: Message[] = userMessages
    .map((userMessage) => {
      const message: Message = {
        id: userMessage.id,
        content: userMessage.text,
        role: "user",
      };
      const aiResponses: Message[] = userMessage.aiResponses.map(
        (aiResponse) => ({
          id: aiResponse.id,
          content: aiResponse.text,
          role: "assistant",
        })
      );
      return [message, ...aiResponses];
    })
    .flat();

  return messages;
}

export default async function SpecificChatPage({
  params,
}: {
  params: { id: string };
}) {
  const messages = await getMessages(params.id);

  return (
    <>
      <Sidebar activeChatId={params.id} />
      <Window initChatId={params.id} initialMessages={messages} />
    </>
  );
}
