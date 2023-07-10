import { websiteConfig } from "@configs";
import { Prisma } from "@prisma/client";
import { PrismaClientValidationError } from "@prisma/client/runtime";
import { createChat, getChats } from "@services/chat";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  try {
    const chats = await getChats({
      orderBy: {
        [orderBy]: order,
      },
      offset: (page - 1) * limit,
      limit,
    });

    return NextResponse.json({
      entities: chats,
      page,
      perPage: limit,
    });
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
    const chat = await createChat(
      Prisma.validator<Prisma.ChatCreateInput>()(data)
    );
    return new NextResponse(
      JSON.stringify({ chat, link: `${websiteConfig.url}/chats/${chat.id}` }),
      {
        status: 201,
      }
    );
  } catch (error) {
    if (error instanceof PrismaClientValidationError) {
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
        error,
      }),
      {
        status: 500,
      }
    );
  }
}
