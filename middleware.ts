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

  // 1. Suporte a subdomínio app.fafeu.online ou preparador.fafeu.online
  if (hostname.startsWith("app.") || hostname.startsWith("preparador.")) {
    if (pathname === "/landing" || request.nextUrl.searchParams.get("view") === "landing") {
      return NextResponse.redirect(new URL("https://fafeu.online", request.url), 301);
    }
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("view", "app");
      return NextResponse.rewrite(url);
    }
  }

  // 2. Suporte a subdomínio cloud.fafeu.online
  if (hostname.startsWith("cloud.")) {
    if (pathname === "/cloud") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/cloud", request.url));
    }
  }

  // Se acessar /cloud no domínio principal fafeu.online, redireciona para o subdomínio cloud.fafeu.online
  if (!hostname.startsWith("cloud.") && pathname === "/cloud") {
    if (!hostname.includes("localhost") && !hostname.includes("127.0.0.1")) {
      return NextResponse.redirect(new URL("https://cloud.fafeu.online", request.url), 301);
    }
  }

  // 3. Suporte a subdomínio contratos.fafeu.online
  if (hostname.startsWith("contratos.")) {
    if (pathname === "/landing" || request.nextUrl.searchParams.get("view") === "landing") {
      return NextResponse.redirect(new URL("https://fafeu.online", request.url), 301);
    }
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("view", "contratos");
      return NextResponse.rewrite(url);
    }
  }

  // 4. Suporte a subdomínio portal.fafeu.online ou cliente.fafeu.online
  if (hostname.startsWith("portal.") || hostname.startsWith("cliente.")) {
    if (pathname === "/landing" || request.nextUrl.searchParams.get("view") === "landing") {
      return NextResponse.redirect(new URL("https://fafeu.online", request.url), 301);
    }
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
