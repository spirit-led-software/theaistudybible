import { prisma } from "@server/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  const indexOp = await prisma.indexOperation.findUnique({
    where: { id: params.id },
  });
  if (!indexOp) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }
  return NextResponse.json(indexOp);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const indexOp = await prisma.indexOperation.findUnique({
    where: { id: params.id },
  });
  if (!indexOp) {
    return new NextResponse(
      JSON.stringify({
        error: `Index operation with ID ${params.id} not found`,
      }),
      {
        status: 404,
      }
    );
  }

  const data = await request.json();
  const { status } = data;
  await prisma.indexOperation.update({
    where: { id: params.id },
    data: { status },
  });
  return new NextResponse(JSON.stringify({ message: "Updated" }), {
    status: 200,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const indexOp = await prisma.indexOperation.findUnique({
    where: { id: params.id },
  });
  if (!indexOp) {
    return new NextResponse(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }
  await prisma.indexOperation.delete({
    where: { id: params.id },
  });
  return new NextResponse(JSON.stringify({ message: "Deleted" }), {
    status: 200,
  });
}
