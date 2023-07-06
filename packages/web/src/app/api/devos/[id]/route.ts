import { prisma } from "@server/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const devo = await prisma.devo.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!devo) {
    return new NextResponse(
      JSON.stringify({
        error: `Devo with ID ${params.id} not found`,
      }),
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(devo);
}
