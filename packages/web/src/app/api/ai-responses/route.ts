import { Prisma } from "@prisma/client";
import { createAiResponse, getAiResponses } from "@services/ai-response";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const page = parseInt(searchParams.get("page") ?? "1");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  try {
    const responses = await getAiResponses({
      orderBy: {
        [orderBy]: order,
      },
      offset: (page - 1) * limit,
      limit,
    });

    return new NextResponse(
      JSON.stringify({
        entities: responses,
        page,
        perPage: limit,
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        error,
      }),
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.json();
  try {
    const response = await createAiResponse(
      Prisma.validator<Prisma.AiResponseCreateInput>()(data)
    );
    return new NextResponse(JSON.stringify(response), {
      status: 201,
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientValidationError) {
      return new NextResponse(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 400,
        }
      );
    }
    return new NextResponse(
      JSON.stringify({
        error,
      }),
      {
        status: 500,
      }
    );
  }
}
