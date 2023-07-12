import { AiResponse, Prisma } from "@prisma/client";
import { prisma } from "@services/database";

type GetAiResponsesOptions = {
  query?: Prisma.AiResponseWhereInput;
  limit?: number;
  offset?: number;
  orderBy?:
    | Prisma.AiResponseOrderByWithAggregationInput
    | Prisma.AiResponseOrderByWithRelationInput;
  include?: Prisma.AiResponseInclude;
};

export async function getAiResponses(
  options?: GetAiResponsesOptions
): Promise<AiResponse[]> {
  const {
    query,
    limit = 25,
    offset = 0,
    orderBy = {
      createdAt: "desc",
    },
    include,
  } = options ?? {};

  const aiResponses = await prisma.aiResponse.findMany({
    where: {
      ...query,
    },
    take: limit,
    skip: offset,
    orderBy,
    include,
  });

  return aiResponses;
}

type GetAiResponseOptions = {
  include?: Prisma.AiResponseInclude;
  throwOnNotFound?: boolean;
};

export async function getAiResponse(
  id: string,
  options?: GetAiResponseOptions
): Promise<AiResponse | null> {
  const { throwOnNotFound = false, include } = options ?? {};

  let aiResponse: AiResponse | null = null;
  if (throwOnNotFound) {
    aiResponse = await prisma.aiResponse.findUniqueOrThrow({
      where: {
        id,
      },
      include,
    });
  } else {
    aiResponse = await prisma.aiResponse.findUnique({
      where: {
        id,
      },
    });
  }

  return aiResponse;
}

export async function createAiResponse(
  data: Prisma.AiResponseCreateInput
): Promise<AiResponse> {
  const aiResponse = await prisma.aiResponse.create({
    data,
  });

  return aiResponse;
}

export async function updateAiResponse(
  id: string,
  data: Prisma.AiResponseUpdateInput
): Promise<AiResponse> {
  const aiResponse = await prisma.aiResponse.update({
    where: {
      id,
    },
    data,
  });
  return aiResponse;
}

export async function deleteAiResponse(id: string): Promise<void> {
  const aiResponse = await prisma.aiResponse.findUniqueOrThrow({
    where: {
      id,
    },
  });

  await prisma.aiResponse.delete({
    where: {
      id: aiResponse.id,
    },
  });
}
