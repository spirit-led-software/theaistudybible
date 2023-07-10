import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { getAiResponses } from "@services/ai-response";
import { getChat } from "@services/chat";
import { getUserMessage } from "@services/user-message";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string; messageId: string } }
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const page = parseInt(searchParams.get("page") ?? "1");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  try {
    const chat = await getChat(params.chatId, {
      throwOnNotFound: true,
    });

    const message = await getUserMessage(params.messageId, {
      throwOnNotFound: true,
    });

    const responses = await getAiResponses({
      query: {
        AND: {
          chatId: chat!.id,
          userMessageId: message!.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      limit,
      offset: (page - 1) * limit,
    });

    return new NextResponse(
      JSON.stringify({
        entities: responses,
        page,
        perPage: limit,
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
