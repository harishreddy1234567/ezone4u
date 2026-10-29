import React, { Suspense } from "react";
import { connection } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";

export const metadata = {
  title: "Ezone4u Admin | Operations & Management",
  description:
    "Administrative portal for Ezone4u operations, order fulfillment, and product catalog management.",
};

async function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const session = await getAdminSession();

  return <AdminLayoutShell session={session}>{children}</AdminLayoutShell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-[#B88B58] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
