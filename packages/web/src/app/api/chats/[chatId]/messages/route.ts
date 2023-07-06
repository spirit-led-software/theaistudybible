import { prisma } from "@server/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "25");

  const chat = await prisma.chat.findUnique({
    where: {
      id: params.chatId,
    },
  });

  if (!chat) {
    return new NextResponse(
      JSON.stringify({
        error: `Chat with ID ${params.chatId} not found`,
      }),
      {
        status: 404,
      }
    );
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      chatId: chat.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({
    entities: messages,
    page,
    perPage: limit,
  });
}
