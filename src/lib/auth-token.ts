import crypto from "crypto";

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: string;
  exp: number;
}

export const ADMIN_COOKIE_NAME = "ezone4u_admin_session";

const SECRET =
  process.env.ADMIN_JWT_SECRET ||
  "ezone4u-default-development-secret-key-32chars";

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 */
export function signAdminToken(admin: {
  id: string;
  email: string;
  name: string;
  role: string;
}): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload: AdminSession = {
    ...admin,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days expiration
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(data);
  const signature = hmac.digest("base64url");

  return `${data}.${signature}`;
}

/**
 * Verifies the HMAC-SHA256 signature and expiration time of a session token.
 */
export function verifyAdminToken(token: string): AdminSession | null {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const hmac = crypto.createHmac("sha256", SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest("base64url");

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const payload: AdminSession = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired session
    }

    return payload;
  } catch {
    return null;
  }
}
