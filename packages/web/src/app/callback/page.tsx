"use client";

import { useSession } from "@hooks/session";
import { redirect, useSearchParams } from "next/navigation";

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const { setSession } = useSession();

  const token = searchParams.get("token");
  if (token) {
    setSession(token);
  }

  redirect("/");
}
