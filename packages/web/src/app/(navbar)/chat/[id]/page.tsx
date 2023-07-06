import { Window } from "@components/chat";
import { prisma } from "@server/database";
import { Message } from "ai/react";

async function getMessages(chatId: string) {
  const messages = await prisma.chatMessage.findMany({
    where: {
      chatId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return messages;
}

export default async function ChatPage({ params }: { params: { id: string } }) {
  const messages = await getMessages(params.id);
  return (
    <>
      <Window
        chatId={params.id}
        initialMessages={messages.map(
          (message): Message => ({
            id: message.id,
            content: message.text,
            role: message.type !== "user" ? "assistant" : message.type,
          })
        )}
      />
    </>
  );
}
