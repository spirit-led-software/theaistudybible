import { apiConfig } from "@configs";
import { BadRequestResponse, OkResponse } from "@lib/api-responses";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { id, redirectPath, email } = await request.json();

  console.log("Received login request: ", { id, redirectPath, email });

  if (!id) {
    return BadRequestResponse("Missing id.");
  }

  if (id === "email" && !email) {
    return BadRequestResponse("Missing email.");
  }

  if (redirectPath) {
    cookies().set("redirect_path", redirectPath);
  }

  const loginUrl =
    email && id === "email"
      ? `${apiConfig.url}/auth/email/authorize?email=${email}`
      : `${apiConfig.url}/auth/${id}/authorize`;

  return OkResponse({ loginUrl });
}
