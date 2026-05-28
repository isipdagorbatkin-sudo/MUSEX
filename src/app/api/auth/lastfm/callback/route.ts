import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const redirectUrl = new URL("/", url.origin);

  if (token) {
    redirectUrl.searchParams.set("lastfm", "connected");
  } else {
    redirectUrl.searchParams.set("lastfm", "missing-token");
  }

  return NextResponse.redirect(redirectUrl);
}
