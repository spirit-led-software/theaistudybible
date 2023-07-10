import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { getChat } from "@services/chat";
import { deleteUserMessage, getUserMessage } from "@services/user-message";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string; messageId: string } }
): Promise<NextResponse> {
  try {
    const chat = await getChat(params.chatId, {
      throwOnNotFound: true,
    });

    const message = await getUserMessage(params.messageId, {
      include: {
        aiResponses: {
          include: {
            sourceDocuments: {
              include: {
                sourceDocument: true,
              },
            },
          },
        },
      },
      throwOnNotFound: true,
    });

    return new NextResponse(JSON.stringify(message), {
      status: 200,
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return new NextResponse(
          JSON.stringify({
            error,
          }),
          {
            status: 404,
          }
        );
      }
    }
    return new NextResponse(
      JSON.stringify({
        error,
      }),
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatId: string; messageId: string } }
): Promise<NextResponse> {
  try {
    const chat = await getChat(params.chatId, {
      throwOnNotFound: true,
    });

    const message = await getUserMessage(params.messageId, {
      throwOnNotFound: true,
    });

    await deleteUserMessage(params.messageId);

    return new NextResponse(
      JSON.stringify({
        message: `Message deleted`,
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return new NextResponse(
          JSON.stringify({
            error,
          }),
          {
            status: 404,
          }
        );
      }
    }
    return new NextResponse(
      JSON.stringify({
        error,
      }),
      {
        status: 500,
      }
    );
  }
}
