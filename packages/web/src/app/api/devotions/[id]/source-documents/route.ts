import {
  getDevotion,
  getDevotionRelatedSourceDocuments,
} from "@core/services/devotion";
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
} from "@lib/api-responses";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    const devotion = await getDevotion(id);
    if (!devotion) {
      return ObjectNotFoundResponse(
        `Could not find AI response with ID ${id}.`
      );
    }

    const sourceDocuments = await getDevotionRelatedSourceDocuments(devotion);

    return OkResponse(sourceDocuments);
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
