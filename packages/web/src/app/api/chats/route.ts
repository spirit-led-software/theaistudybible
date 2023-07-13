import {
  BadRequestResponse,
  CreatedResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { PrismaClientValidationError } from "@prisma/client/runtime/library";
import { createChat, getChats } from "@services/chat";
import { isAdmin, isObjectOwner, validServerSession } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  try {
    let chats = await getChats({
      orderBy: {
        [orderBy]: order,
      },
      offset: (page - 1) * limit,
      limit,
    });

    const { isValid, user } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You are not logged in.");
    }

    chats = chats.filter(async (chat) => {
      return (await isAdmin(user.id)) || isObjectOwner(chat, user);
    });

    return OkResponse({
      entities: chats,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    return InternalServerErrorResponse(error.stack);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.json();
  try {
    const { isValid, user } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }
    const chat = await createChat({
      ...data,
      user: {
        connect: {
          id: user.id,
        },
      },
    });
    return CreatedResponse(chat);
  } catch (error: any) {
    console.error(error);
    if (error instanceof PrismaClientValidationError) {
      return BadRequestResponse(error.message);
    }
    return InternalServerErrorResponse(error.stack);
  }
}
