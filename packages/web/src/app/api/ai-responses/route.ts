import {
  BadRequestResponse,
  CreatedResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { Prisma } from "@prisma/client";
import { createAiResponse, getAiResponses } from "@services/ai-responses";
import { isAdmin, isObjectOwner, validServerSession } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const page = parseInt(searchParams.get("page") ?? "1");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  try {
    let aiResponses = await getAiResponses({
      orderBy: {
        [orderBy]: order,
      },
      offset: (page - 1) * limit,
      limit,
    });

    const { isValid, user } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }

    aiResponses = aiResponses.filter(async (response) => {
      return (await isAdmin(user.id)) || isObjectOwner(response, user);
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
    const { isValid, user } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }
    const aiResponse = await createAiResponse({
      ...data,
      user: {
        connect: {
          id: user.id,
        },
      },
    });

    return CreatedResponse(aiResponse);
  } catch (error: any) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientValidationError) {
      return BadRequestResponse(error.message);
    }
    return InternalServerErrorResponse(error.stack);
  }
}
