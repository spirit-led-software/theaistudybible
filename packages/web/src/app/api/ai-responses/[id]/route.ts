import {
  deleteAiResponse,
  getAiResponse,
  updateAiResponse,
} from "@core/services/ai-response";
import {
  DeletedResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validServerSessionAndObjectOwner } from "@services/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const aiResponse = await getAiResponse(params.id);
    if (!aiResponse) {
      return ObjectNotFoundResponse(params.id);
    }

    const { isValid } = await validServerSessionAndObjectOwner(aiResponse!);
    if (!isValid) {
      return UnauthorizedResponse("You are not the owner of this AI Response");
    }

    return OkResponse(aiResponse);
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
    const aiResponse = await getAiResponse(params.id);
    if (!aiResponse) {
      return ObjectNotFoundResponse(params.id);
    }

    const { isValid } = await validServerSessionAndObjectOwner(aiResponse!);
    if (!isValid) {
      return UnauthorizedResponse("You are not the owner of this AI Response");
    }

    const updatedAiResponse = await updateAiResponse(aiResponse!.id, data);

    return NextResponse.json(updatedAiResponse);
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
    const aiResponse = await getAiResponse(params.id);
    if (!aiResponse) {
      return ObjectNotFoundResponse(params.id);
    }

    const { isValid } = await validServerSessionAndObjectOwner(aiResponse!);

    if (!isValid) {
      return UnauthorizedResponse("You are not the owner of this AI Response");
    }

    await deleteAiResponse(params.id);
    return DeletedResponse(params.id);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
