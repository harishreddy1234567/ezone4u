"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ShieldCheck,
  LogOut,
  Package,
  Layers,
  FolderTree,
  Settings,
  ArrowLeft,
} from "lucide-react";

interface AdminHeaderProps {
  adminName?: string;
  adminEmail?: string;
  adminRole?: string;
}

export default function AdminHeader({
  adminName = "Administrator",
  adminRole = "ADMIN",
}: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  }

  const isOrdersActive = pathname.startsWith("/admin/orders");
  const isProductsActive = pathname.startsWith("/admin/products");
  const isCategoriesActive = pathname.startsWith("/admin/categories");
  const isSettingsActive = pathname.startsWith("/admin/settings");

  return (
    <header className="border-b border-[#E8DFD8] bg-[#FFFDF9] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="flex items-center gap-2 text-[#2D2723] hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif text-lg tracking-wide font-normal">
                Ezone4u
              </span>
              <span className="text-[10px] text-[#B88B58] uppercase tracking-wider font-semibold ml-2 px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E8DFD8]">
                Admin
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-[#ECEAE6]">
            <Link
              href="/admin/orders"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isOrdersActive
                  ? "text-[#2D2723] bg-[#FAF7F2] border border-[#E8DFD8]"
                  : "text-[#786E65] hover:text-[#2D2723] hover:bg-[#FAF7F2]"
                }`}
            >
              <Package className="w-3.5 h-3.5 text-[#B88B58]" />
              <span>Orders</span>
            </Link>

            <Link
              href="/admin/products"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isProductsActive
                  ? "text-[#2D2723] bg-[#FAF7F2] border border-[#E8DFD8]"
                  : "text-[#786E65] hover:text-[#2D2723] hover:bg-[#FAF7F2]"
                }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#B88B58]" />
              <span>Products</span>
            </Link>

            <Link
              href="/admin/categories"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isCategoriesActive
                  ? "text-[#2D2723] bg-[#FAF7F2] border border-[#E8DFD8]"
                  : "text-[#786E65] hover:text-[#2D2723] hover:bg-[#FAF7F2]"
                }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-[#B88B58]" />
              <span>Categories</span>
            </Link>

            <Link
              href="/admin/settings"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isSettingsActive
                  ? "text-[#2D2723] bg-[#FAF7F2] border border-[#E8DFD8]"
                  : "text-[#786E65] hover:text-[#2D2723] hover:bg-[#FAF7F2]"
                }`}
            >
              <Settings className="w-3.5 h-3.5 text-[#B88B58]" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* Right: Admin Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-[#2D2723] leading-tight">
              {adminName}
            </p>
            <p className="text-[10px] text-[#786E65] uppercase tracking-wider">
              {adminRole}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            suppressHydrationWarning
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#786E65] bg-[#FAF7F2] hover:bg-[#F4EFEA] hover:text-[#2D2723] border border-[#E8DFD8] transition-colors"
            title="Sign out of Admin Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-[#786E65] hover:text-[#2D2723] px-2 py-1.5 transition-colors ml-1"
            title="View Public Storefront"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Storefront</span>
          </Link>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden border-t border-[#ECEAE6] px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-around bg-[#FFFDF9]">
        <Link
          href="/admin/orders"
          className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors ${isOrdersActive
              ? "text-[#2D2723] bg-[#FAF7F2] border border-[#E8DFD8]"
              : "text-[#786E65]"
            }`}
        >
          <Package className="w-3.5 h-3.5 text-[#B88B58]" />
          <span>Orders</span>
        </Link>
        <Link
          href="/admin/products"
          className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors ${isProductsActive
              ? "text-[#2D2723] bg-[#FAF7F2] border border-[#E8DFD8]"
              : "text-[#786E65]"
            }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#B88B58]" />
          <span>Products</span>
        </Link>
        <Link
          href="/admin/categories"
          className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors ${isCategoriesActive
              ? "text-[#2D2723] bg-[#FAF7F2] border border-[#E8DFD8]"
              : "text-[#786E65]"
            }`}
        >
          <FolderTree className="w-3.5 h-3.5 text-[#B88B58]" />
          <span>Categories</span>
        </Link>
        <Link
          href="/admin/settings"
          className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors ${isSettingsActive
              ? "text-[#2D2723] bg-[#FAF7F2] border border-[#E8DFD8]"
              : "text-[#786E65]"
            }`}
        >
          <Settings className="w-3.5 h-3.5 text-[#B88B58]" />
          <span>Settings</span>
        </Link>
      </div>
    </header>
  );
}
