import {
  deleteIndexOperation,
  getIndexOperation,
  getIndexOperationOrThrow,
  updateIndexOperation,
} from "@core/services/index-op";
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
): Promise<Response> {
  try {
    const { isValid, user } = await validServerSession();
    if (!isValid || !(await isAdmin(user.id))) {
      return UnauthorizedResponse();
    }

    const indexOp = await getIndexOperationOrThrow(params.id);

    return OkResponse(indexOp);
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
    const { isValid, user } = await validServerSession();
    if (!isValid || !(await isAdmin(user.id))) {
      return UnauthorizedResponse();
    }

    let indexOp = await getIndexOperationOrThrow(params.id);

    indexOp = await updateIndexOperation(indexOp!.id, data);

    return OkResponse(indexOp);
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
    const { isValid, user } = await validServerSession();
    if (!isValid || !(await isAdmin(user.id))) {
      return UnauthorizedResponse();
    }

    const indexOp = await getIndexOperation(params.id);
    if (!indexOp) {
      return ObjectNotFoundResponse(params.id);
    }

    await deleteIndexOperation(indexOp!.id);

    return DeletedResponse();
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
