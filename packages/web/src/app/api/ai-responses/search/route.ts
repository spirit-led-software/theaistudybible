import { getAiResponses } from "@core/services/ai-response";
import { isObjectOwner } from "@core/services/user";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { buildOrderBy, buildQuery } from "@revelationsai/core/database/helpers";
import { aiResponses } from "@revelationsai/core/database/schema";
import { validServerSession } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const page = parseInt(searchParams.get("page") ?? "1");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";
  const { query } = await request.json();

  console.log("Received AI response search request: ", {
    query: JSON.stringify(query),
    limit,
    page,
    orderBy,
    order,
  });

  try {
    let responses = await getAiResponses({
      where: buildQuery(aiResponses, query),
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(aiResponses, orderBy, order),
    });

    const { isValid, userInfo } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }

    responses = responses.filter((response) => {
      return isObjectOwner(response, userInfo.id);
    });

    return OkResponse({
      entities: responses,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
