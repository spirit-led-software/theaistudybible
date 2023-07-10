import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { deleteDevotion, getDevotion } from "@services/devotion";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const devo = await getDevotion(params.id, {
      throwOnNotFound: true,
    });

    return new NextResponse(JSON.stringify(devo), {
      status: 200,
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return new NextResponse(
          JSON.stringify({
            error: "Not found",
          }),
          {
            status: 404,
          }
        );
      }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await deleteDevotion(params.id);
    return new NextResponse(JSON.stringify({ message: "Devotion deleted" }), {
      status: 200,
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return new NextResponse(
          JSON.stringify({
            error,
          }),
          {
            status: 404,
          }
        );
      }
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
