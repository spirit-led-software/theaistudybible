import { Prisma, UserMessage } from "@prisma/client";
import { prisma } from "@services/database";

type GetUserMessagesOptions = {
  query?: Prisma.UserMessageWhereInput;
  limit?: number;
  offset?: number;
  orderBy?:
    | Prisma.UserMessageOrderByWithAggregationInput
    | Prisma.UserMessageOrderByWithRelationInput;
  include?: Prisma.UserMessageInclude;
};

export async function getUserMessages(
  options?: GetUserMessagesOptions
): Promise<UserMessage[]> {
  const {
    query,
    limit = 25,
    offset = 0,
    orderBy = {
      createdAt: "desc",
    },
    include,
  } = options ?? {};

  const userMessages = await prisma.userMessage.findMany({
    where: query,
    take: limit,
    skip: offset,
    orderBy,
    include,
  });

  return userMessages;
}

type GetUserMessageOptions = {
  include?: Prisma.UserMessageInclude;
  throwOnNotFound?: boolean;
};

export async function getUserMessage(
  id: string,
  options?: GetUserMessageOptions
): Promise<UserMessage | null> {
  const {
    include = {
      chat: true,
    },
    throwOnNotFound = false,
  } = options ?? {};

  let userMessage: UserMessage | null = null;
  if (throwOnNotFound) {
    userMessage = await prisma.userMessage.findUniqueOrThrow({
      where: {
        id,
      },
      include,
    });
  } else {
    userMessage = await prisma.userMessage.findUnique({
      where: {
        id,
      },
    });
  }

  return userMessage;
}

export async function createUserMessage(
  data: Prisma.UserMessageCreateInput
): Promise<UserMessage> {
  const userMessage = await prisma.userMessage.create({
    data,
  });

  return userMessage;
}

export async function updateUserMessage(
  id: string,
  data: Prisma.UserMessageUpdateInput
): Promise<UserMessage> {
  const userMessage = await prisma.userMessage.update({
    where: {
      id,
    },
    data,
  });

  return userMessage;
}

export async function deleteUserMessage(id: string): Promise<void> {
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
