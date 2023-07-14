import {
  DeletedResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import {
  deleteAiResponse,
  getAiResponse,
  updateAiResponse,
} from "@services/ai-response";
import { validSessionAndObjectOwner } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const aiResponse = await getAiResponse(params.id, {
      throwOnNotFound: true,
    });

    const { isValid } = await validSessionAndObjectOwner(aiResponse!);
    if (!isValid) {
      return UnauthorizedResponse("You are not the owner of this AI Response");
    }

    return OkResponse(aiResponse);
  } catch (error: any) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NotFoundResponse(error.message);
      }
    }
    return InternalServerErrorResponse(error.stack);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const data = await request.json();

  try {
    const aiResponse = await getAiResponse(params.id, {
      throwOnNotFound: true,
    });

    const { isValid } = await validSessionAndObjectOwner(aiResponse!);
    if (!isValid) {
      return UnauthorizedResponse("You are not the owner of this AI Response");
    }

    Prisma.validator<Prisma.AiResponseUpdateInput>()(data);

    const updatedAiResponse = await updateAiResponse(aiResponse!.id, data);

    return NextResponse.json(updatedAiResponse);
  } catch (error: any) {
    console.error(error);
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NotFoundResponse(error.message);
      }
    }
    return InternalServerErrorResponse(error.stack);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const aiResponse = await getAiResponse(params.id, {
      throwOnNotFound: true,
    });

    const { isValid } = await validSessionAndObjectOwner(aiResponse!);

    if (!isValid) {
      return UnauthorizedResponse("You are not the owner of this AI Response");
    }

    await deleteAiResponse(params.id);
    return DeletedResponse(params.id);
  } catch (error: any) {
    console.error(error);
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NotFoundResponse(error.message);
      }
    }
    return InternalServerErrorResponse(error.stack);
  }
}
