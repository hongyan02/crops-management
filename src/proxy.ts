import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const sessionCookieName = process.env.BETTER_AUTH_COOKIE_NAME ?? "user_auth";

function readSessionCookie(request: NextRequest) {
  return (
    request.cookies.get(sessionCookieName)?.value ??
    request.cookies.get(`__Secure-${sessionCookieName}`)?.value ??
    null
  );
}

export function proxy(request: NextRequest) {
  const sessionCookie = readSessionCookie(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if ((pathname === "/sign-in" || pathname === "/sign-up") && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/sign-in", "/sign-up", "/work/:path*", "/dashboard/:path*"],
};
