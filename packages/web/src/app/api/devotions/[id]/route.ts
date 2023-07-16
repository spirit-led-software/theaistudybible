import { Devotion } from "@chatesv/core/database/model";
import {
  deleteDevotion,
  getDevotion,
  updateDevotion,
} from "@core/services/devotion";
import { isAdmin } from "@core/services/user";
import {
  DeletedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validServerSession } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const devo = await getDevotion(params.id);
    if (!devo) {
      return ObjectNotFoundResponse(params.id);
    }

    return OkResponse(devo);
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
    let devo: Devotion | undefined = await getDevotion(params.id);
    if (!devo) {
      return ObjectNotFoundResponse(params.id);
    }

    const { isValid, user } = await validServerSession();
    if (!isValid || !(await isAdmin(user.id))) {
      return UnauthorizedResponse();
    }

    devo = await updateDevotion(devo!.id, data);

    return OkResponse(devo);
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
    const devo = await getDevotion(params.id);
    if (!devo) {
      return ObjectNotFoundResponse(params.id);
    }

    const { isValid, user } = await validServerSession();
    if (!isValid || !(await isAdmin(user.id))) {
      return UnauthorizedResponse();
    }

    await deleteDevotion(devo!.id);
    return DeletedResponse(devo!.id);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
