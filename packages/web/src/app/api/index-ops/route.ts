import { getIndexOperations } from "@core/services/index-op";
import { isAdmin } from "@core/services/user";
import {
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { buildOrderBy } from "@revelationsai/core/database/helpers";
import { indexOperations } from "@revelationsai/core/database/schema";
import { validServerSession } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  try {
    const { isValid, userInfo } = await validServerSession();
    if (!isValid || !(await isAdmin(userInfo.id))) {
      return UnauthorizedResponse();
    }

    const indexOps = await getIndexOperations({
      offset: (page - 1) * limit,
      limit,
      orderBy: buildOrderBy(indexOperations, orderBy, order),
    });

    return OkResponse({
      entities: indexOps,
      page,
      perPage: limit,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
