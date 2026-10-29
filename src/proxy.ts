import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/auth-token";

const SECRET =
  process.env.ADMIN_JWT_SECRET ||
  "ezone4u-default-development-secret-key-32chars";

async function verifyTokenInProxy(token: string): Promise<boolean> {
  if (!token || typeof token !== "string") return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [encHeader, encPayload, signature] = parts;
    const data = `${encHeader}.${encPayload}`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(data));
    const expectedSig = Buffer.from(sigBuf)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (signature !== expectedSig) {
      return false;
    }

    const payload = JSON.parse(
      Buffer.from(
        encPayload.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf-8")
    );

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Strictly bypass any non-admin routes (customer storefront, shop, cart, checkout)
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  // 2. Read session token from cookie
  const sessionToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = sessionToken
    ? await verifyTokenInProxy(sessionToken)
    : false;

  // 3. Handle public authentication pages (/admin/login, /admin/register)
  const isAuthPage =
    pathname === "/admin/login" || pathname === "/admin/register";
  const isAuthApi =
    pathname === "/api/admin/auth/login" ||
    pathname === "/api/admin/auth/register" ||
    pathname === "/api/admin/auth/logout";

  if (isAuthApi) {
    return NextResponse.next();
  }

  // If already authenticated and accessing login/register page, redirect to orders dashboard
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/admin/orders", request.url));
  }

  // If unauthenticated and accessing login/register page, allow access
  if (isAuthPage) {
    return NextResponse.next();
  }

  // 4. Enforce strict protection for all internal administrative routes
  if (!isAuthenticated) {
    // If calling internal admin API without valid session: reject immediately with 401
    if (pathname.startsWith("/api/admin")) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Valid administrator session required.",
        },
        { status: 401 }
      );
      if (sessionToken) {
        response.cookies.delete(ADMIN_COOKIE_NAME);
      }
      return response;
    }

    // If accessing internal admin page without valid session: redirect immediately to /admin/login
    const loginUrl = new URL("/admin/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    if (sessionToken) {
      response.cookies.delete(ADMIN_COOKIE_NAME);
    }
    return response;
  }

  // 5. Valid authenticated session: attach security headers and proceed
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("x-pathname", pathname);

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

