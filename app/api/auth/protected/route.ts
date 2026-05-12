import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "No access token" }, { status: 401 });
  }

  const backendResponse = await fetch(`${backendUrl}/auth/protected`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: "Unable to access protected route" },
      { status: backendResponse.status },
    );
  }

  const data = await backendResponse.json();
  return NextResponse.json(data, { status: 200 });
}
