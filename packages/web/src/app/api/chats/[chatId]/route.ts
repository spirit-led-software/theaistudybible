import { prisma } from "@server/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
): Promise<NextResponse> {
  const chat = await prisma.chat.findUnique({
    where: {
      id: params.chatId,
    },
    include: {
      messages: true,
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

  return NextResponse.json(chat);
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: { chatId: string };
  }
): Promise<NextResponse> {
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

  await prisma.chat.delete({
    where: {
      id: chat.id,
    },
  });

  return new NextResponse(JSON.stringify({ message: "Deleted" }), {
    status: 200,
  });
}
