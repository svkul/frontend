import { NextResponse } from "next/server";

function getCookieValue(cookieHeader: string, name: string) {
  const match = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : "";
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export async function POST(request: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const refreshToken = getCookieValue(cookieHeader, "refreshToken");
  if (!refreshToken) {
    return NextResponse.json({ message: "No refresh token" }, { status: 401 });
  }

  const backendResponse = await fetch(`${backendUrl}/auth/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: "Unable to refresh access token" },
      { status: backendResponse.status },
    );
  }

  const data = (await backendResponse.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  const response = NextResponse.json({ ok: true as const }, { status: 200 });

  response.cookies.set("accessToken", data.accessToken, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "strict",
    maxAge: 15 * 60,
    path: "/",
  });

  response.cookies.set("refreshToken", data.refreshToken, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/api/auth/refresh",
  });

  return response;
}
