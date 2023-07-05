import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest): NextResponse {
  return NextResponse.json({ hello: "world" });
}
