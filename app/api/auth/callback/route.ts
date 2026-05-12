import { NextResponse } from "next/server";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const accessToken = url.searchParams.get("accessToken");
  const refreshToken = url.searchParams.get("refreshToken");

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL("/auth/callback", url.origin));
  }

  const response = NextResponse.redirect(new URL("/auth/callback", url.origin));

  response.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "strict",
    maxAge: 15 * 60,
    path: "/",
  });

  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/api/auth/refresh",
  });

  return response;
}
