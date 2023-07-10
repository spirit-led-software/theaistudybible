import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { getAiResponse } from "@services/ai-response";
import { getChat } from "@services/chat";
import { getUserMessage } from "@services/user-message";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: { chatId: string; messageId: string; responseId: string } }
): Promise<NextResponse> {
  try {
    const chat = await getChat(params.chatId, {
      throwOnNotFound: true,
    });

    const message = await getUserMessage(params.messageId, {
      throwOnNotFound: true,
    });

    const response = await getAiResponse(params.responseId, {
      include: {
        userMessage: true,
        sourceDocuments: {
          include: {
            sourceDocument: true,
          },
        },
      },
      throwOnNotFound: true,
    });

    return new NextResponse(JSON.stringify(response), {
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
