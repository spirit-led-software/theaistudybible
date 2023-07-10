import { Chat, Prisma } from "@prisma/client";
import { prisma } from "@services/database";

type GetChatsOptions = {
  query?: Prisma.ChatWhereInput;
  limit?: number;
  offset?: number;
  orderBy?:
    | Prisma.ChatOrderByWithAggregationInput
    | Prisma.ChatOrderByWithRelationInput;
  include?: Prisma.ChatInclude;
};

export async function getChats(options?: GetChatsOptions): Promise<Chat[]> {
  const {
    query,
    limit = 25,
    offset = 0,
    orderBy = {
      createdAt: "desc",
    },
    include,
  } = options ?? {};
  const chats = await prisma.chat.findMany({
    where: query,
    take: limit,
    skip: offset,
    orderBy,
    include,
  });
  return chats;
}

type GetChatOptions = {
  include?: Prisma.ChatInclude;
  throwOnNotFound?: boolean;
};

export async function getChat(
  id: string,
  options?: GetChatOptions
): Promise<Chat | null> {
  const { include, throwOnNotFound = false } = options ?? {};

  let chat: Chat | null = null;
  if (throwOnNotFound) {
    chat = await prisma.chat.findUniqueOrThrow({
      where: {
        id,
      },
      include,
    });
  } else {
    chat = await prisma.chat.findUnique({
      where: {
        id,
      },
      include,
    });
  }

  return chat;
}

export async function createChat(data: Prisma.ChatCreateInput): Promise<Chat> {
  const chat = await prisma.chat.create({
    data,
  });
  return chat;
}

export async function updateChat(
  id: string,
  data: Prisma.ChatUpdateInput
): Promise<Chat> {
  const chat = await prisma.chat.update({
    where: {
      id,
    },
    data,
  });
  return chat;
}

export async function deleteChat(id: string): Promise<void> {
  const chat = await prisma.chat.findUniqueOrThrow({
    where: {
      id,
    },
  });

  await prisma.chat.delete({
    where: {
      id: chat.id,
    },
  });
}
