import {
  DeletedResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import {
  deleteIndexOperation,
  getIndexOperation,
  updateIndexOperation,
} from "@services/index-op";
import { isAdmin, validServerSession } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const { isValid, user } = await validServerSession();
    if (!isValid || !isAdmin(user)) {
      return UnauthorizedResponse();
    }

    const indexOp = await getIndexOperation(params.id, {
      throwOnNotFound: true,
    });

    return OkResponse(indexOp);
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
    const { isValid, user } = await validServerSession();
    if (!isValid || !isAdmin(user)) {
      return UnauthorizedResponse();
    }

    let indexOp = await getIndexOperation(params.id, {
      throwOnNotFound: true,
    });

    indexOp = await updateIndexOperation(indexOp!.id, data);

    return OkResponse(indexOp);
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
    const { isValid, user } = await validServerSession();
    if (!isValid || !isAdmin(user)) {
      return UnauthorizedResponse();
    }

    const indexOp = await getIndexOperation(params.id, {
      throwOnNotFound: true,
    });

    await deleteIndexOperation(indexOp!.id);

    return DeletedResponse();
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
