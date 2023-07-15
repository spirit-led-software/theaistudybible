import {
  deleteDevotion,
  getDevotion,
  updateDevotion,
} from "@core/services/devotion";
import { isAdmin } from "@core/services/user";
import {
  DeletedResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { validServerSession } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const devo = await getDevotion(params.id, {
      throwOnNotFound: true,
    });

    return OkResponse(devo);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const data = await request.json();

  try {
    let devo = await getDevotion(params.id, {
      throwOnNotFound: true,
    });

    const { isValid, user } = await validServerSession();
    if (!isValid || !(await isAdmin(user.id))) {
      return UnauthorizedResponse();
    }

    Prisma.validator<Prisma.DevotionUpdateInput>()(data);

    devo = await updateDevotion(devo!.id, data);

    return OkResponse(devo);
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
    const devo = await getDevotion(params.id, {
      throwOnNotFound: true,
    });

    const { isValid, user } = await validServerSession();
    if (!isValid || !(await isAdmin(user.id))) {
      return UnauthorizedResponse();
    }

    await deleteDevotion(devo!.id);
    return DeletedResponse(devo!.id);
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
