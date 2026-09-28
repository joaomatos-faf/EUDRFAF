import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function applySecurityHeaders(res: NextResponse): NextResponse {
  // 1. HTTP Strict Transport Security (HSTS) - 1 ano + subdomínios + preload
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // 2. Proteção contra MIME-sniffing
  res.headers.set("X-Content-Type-Options", "nosniff");

  // 3. Proteção contra Clickjacking
  res.headers.set("X-Frame-Options", "SAMEORIGIN");

  // 4. Controle de Referrer
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 5. Política de Recursos de Hardware / Sensores
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );

  // 6. Content Security Policy (compatível com Leaflet, OpenStreetMap, MapBiomas e Google Maps)
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "img-src 'self' data: blob: https:; " +
      "connect-src 'self' https: wss:; " +
      "frame-ancestors 'self'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
  );

  return res;
}

export function middleware(request: NextRequest) {
  const hostname =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const pathname = request.nextUrl.pathname;
  const proto = request.headers.get("x-forwarded-proto");
  const isLocal =
    hostname.includes("localhost") ||
    hostname.includes("127.0.0.1") ||
    hostname.includes("::1");

  // Redirecionamento obrigatório de HTTP para HTTPS em produção
  if (!isLocal && (proto === "http" || request.nextUrl.protocol === "http:")) {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  // Ignora chamadas de API, estáticos do Next.js e arquivos com extensão para subdomínios,
  // mas aplicando cabeçalhos de segurança padronizados
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 1. Suporte a subdomínio app.fafeu.online ou preparador.fafeu.online
  if (hostname.startsWith("app.") || hostname.startsWith("preparador.")) {
    if (pathname === "/landing" || request.nextUrl.searchParams.get("view") === "landing") {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("https://fafeu.online", request.url), 301)
      );
    }
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("view", "app");
      return applySecurityHeaders(NextResponse.rewrite(url));
    }
  }

  // 2. Suporte a subdomínio cloud.fafeu.online
  if (hostname.startsWith("cloud.")) {
    if (pathname === "/cloud") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return applySecurityHeaders(NextResponse.redirect(url));
    }
    if (pathname === "/") {
      return applySecurityHeaders(NextResponse.rewrite(new URL("/cloud", request.url)));
    }
  }

  // Se acessar /cloud no domínio principal fafeu.online, redireciona para o subdomínio cloud.fafeu.online
  if (!hostname.startsWith("cloud.") && pathname === "/cloud") {
    if (!isLocal) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("https://cloud.fafeu.online", request.url), 301)
      );
    }
  }

  // 3. Suporte a subdomínio contratos.fafeu.online
  if (hostname.startsWith("contratos.")) {
    if (pathname === "/landing" || request.nextUrl.searchParams.get("view") === "landing") {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("https://fafeu.online", request.url), 301)
      );
    }
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("view", "contratos");
      return applySecurityHeaders(NextResponse.rewrite(url));
    }
  }

  // 4. Suporte a subdomínio portal.fafeu.online ou cliente.fafeu.online
  if (hostname.startsWith("portal.") || hostname.startsWith("cliente.")) {
    if (pathname === "/landing" || request.nextUrl.searchParams.get("view") === "landing") {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("https://fafeu.online", request.url), 301)
      );
    }
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("view", "portal");
      return applySecurityHeaders(NextResponse.rewrite(url));
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
