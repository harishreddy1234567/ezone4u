import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAdminSession, signAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { verifyPassword, hashPassword } from "@/lib/auth-crypto";

const updateEmailSchema = z.object({
  action: z.literal("update_email"),
  currentPassword: z.string().min(1, "Current password is required to authorize email change"),
  newEmail: z.string().trim().email("Please provide a valid new email address").max(150),
});

const updatePasswordSchema = z
  .object({
    action: z.literal("update_password"),
    currentPassword: z.string().min(1, "Current password is required to authorize password change"),
    newPassword: z.string().min(8, "New password must be at least 8 characters long").max(100),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirmation password do not match",
    path: ["confirmNewPassword"],
  });

const settingsRequestSchema = z.discriminatedUnion("action", [
  updateEmailSchema,
  updatePasswordSchema,
]);

export async function POST(request: Request) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Administrator session required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parseResult = settingsRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || "Invalid input data provided.",
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Find administrator record in database
    let admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
    });

    if (!admin && session.email) {
      admin = await prisma.adminUser.findUnique({
        where: { email: session.email.toLowerCase() },
      });
    }

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: "Administrator database account not found. Please log in again.",
        },
        { status: 404 }
      );
    }

    // Verify current password with constant-time scrypt check
    const isCurrentPasswordValid = verifyPassword(data.currentPassword, admin.passwordHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Current password is incorrect. Verification failed.",
        },
        { status: 400 }
      );
    }

    // 1. ACTION: Update Email
    if (data.action === "update_email") {
      const normalizedNewEmail = data.newEmail.toLowerCase().trim();

      if (normalizedNewEmail === admin.email.toLowerCase()) {
        return NextResponse.json(
          {
            success: false,
            error: "The new email address cannot be the same as your current email.",
          },
          { status: 400 }
        );
      }

      // Check for duplicate email across administrators
      const existingEmail = await prisma.adminUser.findUnique({
        where: { email: normalizedNewEmail },
      });

      if (existingEmail && existingEmail.id !== admin.id) {
        return NextResponse.json(
          {
            success: false,
            error: "This email address is already in use by another administrator.",
          },
          { status: 400 }
        );
      }

      // Update in MySQL
      const updatedAdmin = await prisma.adminUser.update({
        where: { id: admin.id },
        data: { email: normalizedNewEmail },
      });

      // Issue refreshed session cookie with updated email
      const refreshedToken = signAdminToken({
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.name,
        role: updatedAdmin.role,
      });

      const response = NextResponse.json({
        success: true,
        message: "Administrator email address updated successfully.",
        newEmail: updatedAdmin.email,
      });

      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: refreshedToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // 2. ACTION: Update Password
    if (data.action === "update_password") {
      // Check if new password is identical to old password
      if (verifyPassword(data.newPassword, admin.passwordHash)) {
        return NextResponse.json(
          {
            success: false,
            error: "New password must be different from your current password.",
          },
          { status: 400 }
        );
      }

      // Hash new password securely
      const newPasswordHash = hashPassword(data.newPassword);

      // Update in MySQL
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { passwordHash: newPasswordHash },
      });

      return NextResponse.json({
        success: true,
        message: "Administrator password updated successfully.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Unrecognized settings action." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while updating administrator settings.",
      },
      { status: 500 }
    );
  }
}
