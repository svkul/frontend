import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (accessToken && backendUrl) {
    await fetch(`${backendUrl}/auth/logout-all`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  }

  const response = NextResponse.json({ ok: true as const });

  response.cookies.set("accessToken", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("refreshToken", "", {
    httpOnly: true,
    path: "/api/auth/refresh",
    maxAge: 0,
  });

  return response;
}
