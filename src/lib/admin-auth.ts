import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  AdminSession,
  ADMIN_COOKIE_NAME,
  signAdminToken,
  verifyAdminToken,
} from "@/lib/auth-token";

export type { AdminSession };
export { ADMIN_COOKIE_NAME, signAdminToken, verifyAdminToken };

/**
 * Retrieves the current admin session from incoming cookies in Next.js Server Components / Actions / Route Handlers.
 */
export async function getAdminSession(
  request?: Request
): Promise<AdminSession | null> {
  let sessionToken: string | undefined;

  // 1. Try reading cookie directly from incoming HTTP Request headers
  if (request) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(
        new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]*)`)
      );
      if (match) {
        sessionToken = decodeURIComponent(match[1]);
      }
    }
  }

  // 2. Fall back to Next.js cookies() AsyncLocalStorage store
  if (!sessionToken) {
    try {
      const cookieStore = await cookies();
      sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    } catch {
      // Running outside Next.js request context (e.g. tests)
    }
  }

  if (!sessionToken) return null;
  return verifyAdminToken(sessionToken);
}

/**
 * Enforces admin authorization. If unauthenticated, immediately redirects to /admin/login.
 */
export async function requireAdminSession(): Promise<AdminSession> {
  await connection();
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
