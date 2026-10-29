import React, { Suspense } from "react";
import { connection } from "next/server";
import prisma from "@/lib/prisma";
import AdminRegisterForm from "@/components/admin/AdminRegisterForm";

export const metadata = {
  title: "Administrator Registration | Ezone4u Operations",
  description: "One-time initial administrator registration for Ezone4u Operations Portal.",
};

async function RegisterFormContent() {
  await connection();
  let isRegistrationAllowed = false;

  try {
    const adminCount = await prisma.adminUser.count();
    const allowRegistrationEnv = process.env.ALLOW_ADMIN_REGISTRATION === "true";
    isRegistrationAllowed = adminCount === 0 || allowRegistrationEnv;
  } catch {
    isRegistrationAllowed = false;
  }

  return <AdminRegisterForm initialAllowed={isRegistrationAllowed} />;
}

export default function AdminRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-[#B88B58] border-t-transparent animate-spin" />
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
