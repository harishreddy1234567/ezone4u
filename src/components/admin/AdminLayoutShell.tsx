"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import type { AdminSession } from "@/lib/admin-auth";

interface AdminLayoutShellProps {
  children: React.ReactNode;
  session: AdminSession | null;
}

/**
 * AdminLayoutShell governs the presentation layer for all administrative routes.
 *
 * For `/admin/login`:
 * - Dedicated standalone authentication layout
 * - Does NOT display AdminHeader or customer Header
 * - Clean, focused luxury login frame
 *
 * For authenticated admin routes (/admin/orders, /admin/products, /admin/settings, etc.):
 * - Dedicated AdminHeader with Ezone4u Admin branding
 * - Orders, Products, and Settings management navigation
 * - Administrator identity and secure logout action
 * - Internal operations footer
 * - Completely isolated from customer storefront header/footer
 */
export default function AdminLayoutShell({
  children,
  session,
}: AdminLayoutShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/admin/login" || pathname === "/admin/register";

  useEffect(() => {
    if (!session && !isAuthPage) {
      router.replace("/admin/login");
    }
  }, [session, isAuthPage, router]);

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between">
        <main className="flex-1 flex items-center justify-center p-4">
          {children}
        </main>
        <footer className="py-4 text-center text-xs text-[#786E65] border-t border-[#E8DFD8] bg-[#FFFDF9]">
          <p>© {new Date().getFullYear()} Ezone4u Operations Portal · Authorized Personnel Only</p>
        </footer>
      </div>
    );
  }

  // If not authenticated and attempting to view internal admin pages, block rendering & redirect
  if (!session) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-[#B88B58] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <AdminHeader
        adminName={session?.name || "Administrator"}
        adminEmail={session?.email || "admin@ezone4u.com"}
        adminRole={session?.role || "ADMIN"}
      />
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-5 px-4 sm:px-6 lg:px-8 border-t border-[#E8DFD8] bg-[#FFFDF9] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#786E65]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#52796F]" />
            <span className="font-medium text-[#2D2723]">Ezone4u Admin Portal</span>
            <span>·</span>
            <span>Internal Fulfillment & Catalog Management</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Environment: Active</span>
            <span>·</span>
            <span>E-Commerce System v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
