import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const pathname = request.nextUrl.pathname;

  // Suporte a subdomínio cloud.fafeu.online
  if (
    hostname.startsWith("cloud.") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/cloud") &&
    !pathname.includes(".")
  ) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/cloud", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
