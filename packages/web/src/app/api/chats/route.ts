import { buildOrderBy } from "@chatesv/core/database/helpers";
import { chats as chatsTable } from "@chatesv/core/database/schema";
import { createChat, getChats } from "@core/services/chat";
import { isObjectOwner } from "@core/services/user";
import {
  CreatedResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validServerSessionFromRequest } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  try {
    const { isValid, userInfo } = await validServerSessionFromRequest(request);
    if (!isValid) {
      return UnauthorizedResponse("You are not logged in.");
    }

    const chats = await getChats({
      orderBy: buildOrderBy(chatsTable, orderBy, order),
      offset: (page - 1) * limit,
      limit,
    })
      .then((chats) => {
        return chats.filter((chat) => isObjectOwner(chat, userInfo.id));
      })
      .catch((error) => {
        throw new Error(error);
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
    const { isValid, userInfo } = await validServerSessionFromRequest(request);
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }
    const chat = await createChat({
      ...data,
      userId: userInfo.id,
    });
    return CreatedResponse(chat);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
