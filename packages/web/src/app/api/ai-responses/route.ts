import { createAiResponse, getAiResponses } from "@core/services/ai-response";
import { isAdmin, isObjectOwner } from "@core/services/user";
import {
  CreatedResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { buildOrderBy } from "@revelationsai/core/database/helpers";
import { aiResponses as aiResponsesTable } from "@revelationsai/core/database/schema";
import { validServerSession } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const page = parseInt(searchParams.get("page") ?? "1");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  try {
    let aiResponses = await getAiResponses({
      orderBy: buildOrderBy(aiResponsesTable, orderBy, order),
      offset: (page - 1) * limit,
      limit,
    });

    const { isValid, userInfo } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }

    aiResponses = aiResponses.filter(async (response) => {
      return (
        (await isAdmin(userInfo.id)) || isObjectOwner(response, userInfo.id)
      );
    });

    return OkResponse({
      entities: aiResponses,
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
      return UnauthorizedResponse("You must be logged in");
    }
    const aiResponse = await createAiResponse({
      ...data,
      userId: userInfo.id,
    });

    return CreatedResponse(aiResponse);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
