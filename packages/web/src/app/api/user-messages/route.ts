import {
  CreatedResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { isAdmin, isObjectOwner, validServerSession } from "@services/user";
import { createUserMessage, getUserMessages } from "@services/user-messages";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const page = parseInt(searchParams.get("page") ?? "1");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";
  const chatId = searchParams.get("chatId");

  try {
    const { isValid, user } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in.");
    }

    let messages = await getUserMessages({
      query: {
        chatId: chatId ?? undefined,
      },
      limit,
      offset: (page - 1) * limit,
      orderBy: {
        [orderBy]: order,
      },
    });

    messages = messages.filter(async (message) => {
      return (await isAdmin(user.id)) || isObjectOwner(message, user);
    });

    return OkResponse({
      entities: messages,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.json();

  try {
    const { isValid, user } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in.");
    }

    const message = await createUserMessage({
      ...data,
      user: {
        connect: {
          id: user.id,
        },
      },
    });

    return CreatedResponse(message);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
