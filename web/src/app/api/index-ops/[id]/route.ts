import { NextRequest, NextResponse } from "next/server";

export function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): NextResponse {
  return NextResponse.json({ id: params.id });
}
