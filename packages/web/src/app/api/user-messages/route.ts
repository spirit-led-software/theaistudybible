import { prisma } from "@/services/database";
import { websiteConfig } from "@configs/index";
import { UserMessage } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const page = parseInt(searchParams.get("page") ?? "1");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  const messages = await prisma.userMessage.findMany({
    orderBy: {
      [orderBy]: order,
    },
    take: limit,
    skip: (page - 1) * limit,
  });

  return new NextResponse(
    JSON.stringify({
      entities: messages,
      page,
      perPage: limit,
    }),
    {
      status: 200,
    }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.json();
  let message: UserMessage;
  try {
    message = await prisma.userMessage.create({
      data,
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        error,
      }),
      {
        status: 400,
      }
    );
  }

  return new NextResponse(
    JSON.stringify({
      message,
      link: `${websiteConfig.url}/api/user-messages/${message.id}`,
    }),
    {
      status: 201,
    }
  );
}
