import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-crypto";

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters"),
    email: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .max(150, "Email address is too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password cannot exceed 100 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match. Please re-enter your confirmation password.",
    path: ["confirmPassword"],
  });

/**
 * GET /api/admin/auth/register
 * Checks whether administrator registration is currently available.
 */
export async function GET() {
  try {
    const adminCount = await prisma.adminUser.count();
    const allowRegistrationEnv = process.env.ALLOW_ADMIN_REGISTRATION === "true";
    const isRegistrationAllowed = adminCount === 0 || allowRegistrationEnv;
    return NextResponse.json({
      success: true,
      allowed: isRegistrationAllowed,
      adminExists: adminCount > 0,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Database error checking administrator status." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/auth/register
 * Administrator registration endpoint.
 * Protected: Closed if an administrator exists unless ALLOW_ADMIN_REGISTRATION is set to "true".
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.error.issues[0]?.message ||
            "Invalid registration information provided.",
        },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if administrator registration is allowed
    const adminCount = await prisma.adminUser.count();
    const allowRegistrationEnv = process.env.ALLOW_ADMIN_REGISTRATION === "true";

    if (adminCount > 0 && !allowRegistrationEnv) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Administrator registration is closed. An administrator account is already established. Please sign in to access the portal.",
          registrationClosed: true,
        },
        { status: 403 }
      );
    }

    // Check if the specific email is already registered
    const existingUser = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (allowRegistrationEnv) {
        // Safe local administrator replacement: archive the old admin's email
        // so the new administrator can register with their desired email,
        // while preserving the old account record in MySQL for verification.
        const archivedEmail = `archived-${existingUser.id.slice(0, 8)}-${existingUser.email}`;
        await prisma.adminUser.update({
          where: { id: existingUser.id },
          data: { email: archivedEmail },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "An administrator with this email address already exists.",
          },
          { status: 400 }
        );
      }
    }

    // Hash the password securely using scrypt with unique salt
    const passwordHash = hashPassword(password);

    // Create the new administrator
    const newAdmin = await prisma.adminUser.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Administrator registered successfully! You may now sign in using your credentials.",
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while processing administrator registration.",
      },
      { status: 500 }
    );
  }
}
