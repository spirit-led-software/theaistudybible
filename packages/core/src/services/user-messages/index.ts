import { Prisma } from "@prisma/client";
import { prisma } from "@services/database";
import { GetUserMessageOptions, GetUserMessagesOptions } from "./types";

export async function getUserMessages(options?: GetUserMessagesOptions) {
  const {
    query,
    limit = 25,
    offset = 0,
    orderBy = {
      createdAt: "desc",
    },
    include,
  } = options ?? {};

  return await prisma.userMessage.findMany({
    where: query,
    take: limit,
    skip: offset,
    orderBy,
    include,
  });
}

export async function getUserMessage(
  id: string,
  options?: GetUserMessageOptions
) {
  const {
    throwOnNotFound = false,
    include = {
      chat: true,
    },
  } = options ?? {};

  if (throwOnNotFound) {
    return await prisma.userMessage.findUniqueOrThrow({
      where: {
        id,
      },
      include,
    });
  }

  return await prisma.userMessage.findUnique({
    where: {
      id,
    },
  });
}

export async function createUserMessage(data: Prisma.UserMessageCreateInput) {
  return await prisma.userMessage.create({
    data,
  });
}

export async function updateUserMessage(
  id: string,
  data: Prisma.UserMessageUpdateInput
) {
  return await prisma.userMessage.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteUserMessage(id: string) {
  const userMessage = await prisma.userMessage.findUniqueOrThrow({
    where: {
      id,
    },
  });

  await prisma.userMessage.delete({
    where: {
      id: userMessage.id,
    },
  });
}
