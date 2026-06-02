import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const sessionCookieName = process.env.BETTER_AUTH_COOKIE_NAME ?? "user_auth";
const protectedPaths = [
  "/dashboard",
  "/products",
  "/quality",
  "/prices",
  "/price-overview",
  "/suppliers",
  "/buyers",
] as const;

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
  const isProtectedPath = protectedPaths.some(
    (protectedPath) => pathname === protectedPath || pathname.startsWith(`${protectedPath}/`),
  );

  if (isProtectedPath && !sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if ((pathname === "/sign-in" || pathname === "/sign-up") && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/sign-in",
    "/sign-up",
    "/dashboard/:path*",
    "/products/:path*",
    "/quality/:path*",
    "/prices/:path*",
    "/price-overview/:path*",
    "/suppliers/:path*",
    "/buyers/:path*",
  ],
};
