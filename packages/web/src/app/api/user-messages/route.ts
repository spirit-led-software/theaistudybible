import { buildOrderBy } from "@chatesv/core/database/helpers";
import { userMessages } from "@chatesv/core/database/schema";
import { isAdmin, isObjectOwner } from "@core/services/user";
import {
  createUserMessage,
  getUserMessages,
} from "@core/services/user-message";
import {
  CreatedResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";

import { validServerSession } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const page = parseInt(searchParams.get("page") ?? "1");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  try {
    const { isValid, userId } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in.");
    }

    let messages = await getUserMessages({
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(userMessages, orderBy, order),
    });

    messages = messages.filter(async (message) => {
      return (await isAdmin(userId)) || isObjectOwner(message, userId);
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
    const { isValid, userId } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in.");
    }

    const message = await createUserMessage({
      ...data,
      user: {
        connect: {
          id: userId,
        },
      },
    });

    return CreatedResponse(message);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
