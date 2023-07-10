import { generateDevotion, getDevotions } from "@services/devotion";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  try {
    const devos = await getDevotions({
      orderBy: {
        [orderBy]: order,
      },
      offset: (page - 1) * limit,
      limit,
    });

    return new NextResponse(
      JSON.stringify({
        entities: devos,
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
  const { bibleVerse } = data;

  try {
    const devo = await generateDevotion(bibleVerse);

    return new NextResponse(JSON.stringify(devo), {
      status: 201,
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
