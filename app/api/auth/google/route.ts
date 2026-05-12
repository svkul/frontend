import { NextResponse } from "next/server";

export function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "BACKEND_URL or NEXT_PUBLIC_BACKEND_URL is not configured" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(`${backendUrl}/auth/google`);
}
