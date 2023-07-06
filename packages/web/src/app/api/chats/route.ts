import { websiteConfig } from "@configs/index";
import { prisma } from "@server/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "25");

  const chats = await prisma.chat.findMany({
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({
    entities: chats,
    page,
    perPage: limit,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.json();
  const { name } = data;
  const chat = await prisma.chat.create({
    data: {
      name,
    },
  });

  return new NextResponse(
    JSON.stringify({ chat, link: `${websiteConfig.url}/chats/${chat.id}` }),
    {
      status: 201,
    }
  );
}
