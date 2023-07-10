import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { getChat } from "@services/chat";
import { getUserMessages } from "@services/user-message";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  try {
    const chat = await getChat(params.chatId, {
      throwOnNotFound: true,
    });

    const messages = await getUserMessages({
      query: {
        chatId: chat!.id,
      },
      orderBy: {
        [orderBy]: order,
      },
      offset: (page - 1) * limit,
      limit,
    });

    return new NextResponse(
      JSON.stringify({
        entities: messages,
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
