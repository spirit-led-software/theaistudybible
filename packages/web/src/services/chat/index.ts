import { Prisma } from "@prisma/client";
import { prisma } from "@services/database";
import { GetChatOptions, GetChatsOptions } from "./types";

export async function getChats(options?: GetChatsOptions) {
  const {
    query,
    limit = 25,
    offset = 0,
    orderBy = {
      createdAt: "desc",
    },
    include,
  } = options ?? {};

  return await prisma.chat.findMany({
    where: query,
    take: limit,
    skip: offset,
    orderBy,
    include,
  });
}

export async function getChat(id: string, options?: GetChatOptions) {
  const { include, throwOnNotFound = false } = options ?? {};

  if (throwOnNotFound) {
    return await prisma.chat.findUniqueOrThrow({
      where: {
        id,
      },
      include,
    });
  }

  return await prisma.chat.findUnique({
    where: {
      id,
    },
    include,
  });
}

export async function createChat(data: Prisma.ChatCreateInput) {
  return await prisma.chat.create({
    data,
  });
}

export async function updateChat(id: string, data: Prisma.ChatUpdateInput) {
  return await prisma.chat.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteChat(id: string) {
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
