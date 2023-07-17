import { isObjectOwner } from "@core/services/user";
import { deleteUserMessage, getUserMessage } from "@core/services/user-message";
import {
  DeletedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validObjectOwnerFromRequest } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userMessage = await getUserMessage(params.id);
    if (!userMessage) {
      return ObjectNotFoundResponse(params.id);
    }

    const { isValid, userInfo } = await validObjectOwnerFromRequest(
      request,
      userMessage
    );
    if (!isValid || !isObjectOwner(userMessage, userInfo.id)) {
      return UnauthorizedResponse(
        "You are not the owner of this user message."
      );
    }

    return OkResponse(userMessage);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userMessage = await getUserMessage(params.id);
    if (!userMessage) {
      return ObjectNotFoundResponse(params.id);
    }

    const { isValid, userInfo } = await validObjectOwnerFromRequest(
      request,
      userMessage
    );
    if (!isValid || !isObjectOwner(userMessage, userInfo.id)) {
      return UnauthorizedResponse(
        "You are not the owner of this user message."
      );
    }

    await deleteUserMessage(userMessage!.id);
    return DeletedResponse(userMessage!.id);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
