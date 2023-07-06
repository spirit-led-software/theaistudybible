import { prisma } from "@server/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string; messageId: string } }
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

  const message = await prisma.chatMessage.findUnique({
    where: {
      id: params.messageId,
    },
    include: {
      sourceDocuments: {
        include: {
          sourceDocument: true,
        },
      },
    },
  });

  if (!message) {
    return new NextResponse(
      JSON.stringify({
        error: `Message with ID ${params.messageId} not found`,
      }),
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(message);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatId: string; messageId: string } }
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

  const message = await prisma.chatMessage.findUnique({
    where: {
      id: params.messageId,
    },
  });

  if (!message) {
    return new NextResponse(
      JSON.stringify({
        error: `Message with ID ${params.messageId} not found`,
      }),
      {
        status: 404,
      }
    );
  }

  await prisma.chatMessage.delete({
    where: {
      id: params.messageId,
    },
  });

  return NextResponse.json(message);
}
