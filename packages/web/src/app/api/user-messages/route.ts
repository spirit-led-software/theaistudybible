import { isObjectOwner } from "@core/services/user";
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
import { buildOrderBy } from "@revelationsai/core/database/helpers";
import { userMessages } from "@revelationsai/core/database/schema";
import { validServerSession } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const page = parseInt(searchParams.get("page") ?? "1");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  try {
    const { isValid, userInfo } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in.");
    }

    let messages = await getUserMessages({
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(userMessages, orderBy, order),
    });

    messages = messages.filter((message) => {
      return isObjectOwner(message, userInfo.id);
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
    const { isValid, userInfo } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in.");
    }

    const message = await createUserMessage({
      ...data,
      userId: userInfo.id,
    });

    return CreatedResponse(message);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
