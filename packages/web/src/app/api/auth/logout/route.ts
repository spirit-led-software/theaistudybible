import config from "@configs/website";
import { UnauthorizedResponse } from "@lib/api-responses";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionToken = cookies().get("session");
  if (!sessionToken) {
    return UnauthorizedResponse("You are not logged in.");
  }

  cookies().set("session", "", {
    maxAge: 0,
  });

  return NextResponse.redirect(`${config.url}`);
}
