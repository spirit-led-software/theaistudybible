import { websiteConfig } from "@configs";
import { validSession } from "@services/session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const sessionToken = searchParams.get("token");

  if (!sessionToken) {
    return NextResponse.redirect(
      `${websiteConfig.url}/login?error=No token provided in callback!`
    );
  }

  cookies().set("session", sessionToken, {
    secure: true,
  });

  const { isValid } = await validSession();
  if (!isValid) {
    return NextResponse.redirect(
      `${websiteConfig.url}/login?error=Invalid Token!`
    );
  }

  const redirect = cookies().get("redirect_path");
  if (redirect) {
    cookies().set("redirect_path", "", {
      maxAge: 0,
    });
  }

  return NextResponse.redirect(`${websiteConfig.url}${redirect?.value ?? "/"}`);
}
