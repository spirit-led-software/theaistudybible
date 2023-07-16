import { buildOrderBy, buildQuery } from "@chatesv/core/database/helpers";
import { aiResponses } from "@chatesv/core/database/schema";
import { getAiResponses } from "@core/services/ai-response";
import { isAdmin, isObjectOwner } from "@core/services/user";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validServerSession } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const page = parseInt(searchParams.get("page") ?? "1");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";
  const { query, include } = await request.json();

  try {
    let responses = await getAiResponses({
      where: buildQuery(aiResponses, query),
      limit,
      offset: (page - 1) * limit,
      orderBy: buildOrderBy(aiResponses, orderBy, order),
    });

    const { isValid, user } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }

    responses = responses.filter(async (response) => {
      return (await isAdmin(user.id)) || isObjectOwner(response, user);
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
