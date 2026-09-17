import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware: security headers + CSRF Origin validation for state-changing requests.
 */

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Permissions-Policy": "geolocation=(self), camera=(), microphone=(), payment=()",
  // CSP: allow inline styles (app uses globals.css + inline styles) and Leaflet from unpkg.
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://unpkg.com",
    "img-src 'self' data: blob: https: *.tile.openstreetmap.org https://unpkg.com",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

export function middleware(req: NextRequest) {
  // CSRF: validate Origin/Referer on state-changing methods.
  const method = req.method.toUpperCase();
  if (method === "POST" || method === "PUT" || method === "DELETE" || method === "PATCH") {
    const expectedHost = req.headers.get("host");
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");

    const source = origin || referer;
    if (source && expectedHost) {
      try {
        const sourceUrl = new URL(source);
        if (sourceUrl.host !== expectedHost) {
          return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
      }
    }
    // If neither header is present, allow: SameSite cookie is primary CSRF defense.
    // This adds defense-in-depth for browsers that send Origin/Referer.
  }

  const res = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export const config = {
  // Apply to all routes except static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.json|shots|icons).*)",
  ],
};
