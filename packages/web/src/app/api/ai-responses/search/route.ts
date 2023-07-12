import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { Prisma } from "@prisma/client";
import { getAiResponses } from "@services/ai-response";
import { isAdmin, isObjectOwner, validServerSession } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const page = parseInt(searchParams.get("page") ?? "1");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";
  const { query, include } = await request.json();

  try {
    Prisma.validator<Prisma.AiResponseWhereInput>()(query);
    Prisma.validator<Prisma.AiResponseInclude>()(include);

    let responses = await getAiResponses({
      query,
      orderBy: {
        [orderBy]: order,
      },
      offset: (page - 1) * limit,
      limit,
      include,
    });

    const { isValid, user } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }

    responses = responses.filter((response) => {
      return isAdmin(user) || isObjectOwner(response, user);
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
