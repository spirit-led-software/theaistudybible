import { deleteChat, getChat, updateChat } from "@core/services/chat";
import { Chat } from "@revelationsai/core/database/model";

import {
  DeletedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validObjectOwner } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const chat = await getChat(params.id);
    if (!chat) {
      return ObjectNotFoundResponse(params.id);
    }

    const { isValid } = await validObjectOwner(chat);
    if (!isValid) {
      return UnauthorizedResponse("You are not the owner of this chat.");
    }

    return OkResponse(chat);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const data = await request.json();

  try {
    let chat: Chat | undefined = await getChat(params.id);
    if (!chat) {
      return ObjectNotFoundResponse(params.id);
    }

    const { isValid } = await validObjectOwner(chat);
    if (!isValid) {
      return UnauthorizedResponse("You are not the owner of this chat.");
    }

    chat = await updateChat(chat!.id, data);

    return OkResponse(chat);
  } catch (error: any) {
    return InternalServerErrorResponse(error.stack);
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: { id: string };
  }
): Promise<NextResponse> {
  try {
    const chat = await getChat(params.id);
    if (!chat) {
      return ObjectNotFoundResponse(params.id);
    }

    const { isValid } = await validObjectOwner(chat);
    if (!isValid) {
      return UnauthorizedResponse("You are not the owner of this chat.");
    }

    await deleteChat(chat!.id);
    return DeletedResponse(chat!.id);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
