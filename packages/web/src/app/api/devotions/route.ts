import { buildOrderBy } from "@chatesv/core/database/helpers";
import { devotions } from "@chatesv/core/database/schema";
import { generateDevotion, getDevotions } from "@core/services/devotion";
import { isAdmin } from "@core/services/user";
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
    const devos = await getDevotions({
      orderBy: buildOrderBy(devotions, orderBy, order),
      offset: (page - 1) * limit,
      limit,
    });

    return OkResponse({
      entities: devos,
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
  const { bibleVerse } = data;

  try {
    const { isValid, userInfo } = await validServerSessionFromRequest(request);
    if (!isValid || !(await isAdmin(userInfo.id))) {
      return UnauthorizedResponse();
    }

    const devo = await generateDevotion(bibleVerse);

    return CreatedResponse(devo);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
