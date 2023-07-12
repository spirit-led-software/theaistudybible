import {
  DeletedResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { validSessionAndObjectOwner } from "@services/user";
import { deleteUserMessage, getUserMessage } from "@services/user-message";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userMessage = await getUserMessage(params.id, {
      throwOnNotFound: true,
    });

    const { isValid } = await validSessionAndObjectOwner(userMessage!);
    if (!isValid) {
      return UnauthorizedResponse(
        "You are not the owner of this user message."
      );
    }

    return OkResponse(userMessage);
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
    const userMessage = await getUserMessage(params.id, {
      throwOnNotFound: true,
    });

    const { isValid } = await validSessionAndObjectOwner(userMessage!);
    if (!isValid) {
      return UnauthorizedResponse(
        "You are not the owner of this user message."
      );
    }

    await deleteUserMessage(userMessage!.id);
    return DeletedResponse(userMessage!.id);
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
