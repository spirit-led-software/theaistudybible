import {
  DeletedResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { deleteChat, getChat, updateChat } from "@services/chat";
import { validSessionAndObjectOwner } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const chat = await getChat(params.id, {
      include: {
        userMessages: true,
        aiResponses: true,
      },
      throwOnNotFound: true,
    });

    const { isValid } = await validSessionAndObjectOwner(chat!);
    if (!isValid) {
      return UnauthorizedResponse("You are not the owner of this chat.");
    }

    return OkResponse(chat);
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
    const chat = await getChat(params.id, {
      throwOnNotFound: true,
    });

    const { isValid } = await validSessionAndObjectOwner(chat!);
    if (!isValid) {
      return UnauthorizedResponse("You are not the owner of this chat.");
    }

    Prisma.validator<Prisma.ChatUpdateInput>()(data);

    const updatedChat = await updateChat(chat!.id, data);

    return NextResponse.json(updatedChat);
  } catch (error: any) {
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
  {
    params,
  }: {
    params: { id: string };
  }
): Promise<NextResponse> {
  try {
    const chat = await getChat(params.id, {
      throwOnNotFound: true,
    });

    const { isValid } = await validSessionAndObjectOwner(chat!);
    if (!isValid) {
      return UnauthorizedResponse("You are not the owner of this chat.");
    }

    await deleteChat(chat!.id);
    return DeletedResponse(chat!.id);
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
