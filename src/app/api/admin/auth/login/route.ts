import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth-crypto";
import { signAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid admin email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Invalid login credentials",
        },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const defaultAdminEmail = (process.env.ADMIN_EMAIL || "admin@ezone4u.com").toLowerCase();
    const defaultAdminPassword = process.env.ADMIN_PASSWORD || "Ezone4uAdmin@2026";
    const defaultAdminName = process.env.ADMIN_NAME || "Ezone4u SuperAdmin";

    let authenticatedAdmin: { id: string; email: string; name: string; role: string } | null = null;

    try {
      const dbAdmin = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (dbAdmin && verifyPassword(password, dbAdmin.passwordHash)) {
        authenticatedAdmin = {
          id: dbAdmin.id,
          email: dbAdmin.email,
          name: dbAdmin.name,
          role: dbAdmin.role,
        };
      }
    } catch {
      // If database is temporarily unavailable during setup, fallback to environment credentials
    }

    // Check environment default credentials only as resilient fallback when no database admin exists
    if (!authenticatedAdmin) {
      if (
        email.toLowerCase() === defaultAdminEmail &&
        password === defaultAdminPassword
      ) {
        const dbAdminCount = await prisma.adminUser.count().catch(() => 0);
        if (dbAdminCount === 0) {
          authenticatedAdmin = {
            id: "env-superadmin",
            email: defaultAdminEmail,
            name: defaultAdminName,
            role: "SUPERADMIN",
          };
        }
      }
    }

    if (!authenticatedAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid admin email or password. Access denied.",
        },
        { status: 401 }
      );
    }

    // Generate signed session token
    const token = signAdminToken(authenticatedAdmin);

    const response = NextResponse.json({
      success: true,
      admin: {
        id: authenticatedAdmin.id,
        name: authenticatedAdmin.name,
        email: authenticatedAdmin.email,
        role: authenticatedAdmin.role,
      },
    });

    // Set HttpOnly session cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during admin sign-in.",
      },
      { status: 500 }
    );
  }
}
