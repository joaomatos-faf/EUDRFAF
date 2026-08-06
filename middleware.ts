import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const pathname = request.nextUrl.pathname;

  // Ignora chamadas de API, estáticos do Next.js e arquivos com extensão
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 1. Suporte a subdomínio cloud.fafeu.online
  if (hostname.startsWith("cloud.")) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/cloud", request.url));
    }
  }

  // 2. Suporte a subdomínio contratos.fafeu.online
  if (hostname.startsWith("contratos.")) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("view", "contratos");
      return NextResponse.rewrite(url);
    }
  }

  // 3. Suporte a subdomínio portal.fafeu.online ou cliente.fafeu.online
  if (hostname.startsWith("portal.") || hostname.startsWith("cliente.")) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("view", "portal");
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
