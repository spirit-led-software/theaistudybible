import {
  getAiResponse,
  getAiResponseRelatedSourceDocuments,
} from "@core/services/ai-response";
import {
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
    const { id } = params;

    const aiResponse = await getAiResponse(id);
    if (!aiResponse) {
      return ObjectNotFoundResponse(
        `Could not find AI response with ID ${id}.`
      );
    }

    const { isValid } = await validObjectOwner(aiResponse);
    if (!isValid) {
      return UnauthorizedResponse("You don't own this AI response.");
    }

    const sourceDocuments = await getAiResponseRelatedSourceDocuments(
      aiResponse
    );

    return OkResponse(sourceDocuments);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
