import { prisma } from "@server/database";
import { redirect } from "next/navigation";

async function getChats() {
  const chats = await prisma.chat.findMany({
    take: 25,
    skip: 0,
    orderBy: {
      createdAt: "desc",
    },
  });
  return chats;
}

async function createChat() {
  const chat = await prisma.chat.create({
    data: {
      name: "New Chat",
    },
  });
  return chat;
}

export default async function ChatRedirectPage() {
  const chats = await getChats();
  let chat = chats[0];
  if (!chat) {
    chat = await createChat();
  }
  redirect(`/chat/${chat.id}`);
}
