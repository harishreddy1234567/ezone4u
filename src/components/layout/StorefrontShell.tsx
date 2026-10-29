"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";

interface StorefrontShellProps {
  children: React.ReactNode;
}

/**
 * StorefrontShell separates customer storefront layout from admin panel layout.
 *
 * For all customer routes (/, /shop, /cart, /checkout, /about, /contact, etc.):
 * - Injects CartProvider
 * - Renders Customer Header (Announcement Bar, Brand Logo, Customer Navigation, Search, Shopping Bag)
 * - Renders Customer Footer (Brand Story, Quick Links, Google Maps Embed, Store Info)
 *
 * For all administrative routes (/admin/*):
 * - Bypasses customer Header and Footer completely
 * - Yields directly to the dedicated Admin Panel Layout
 */
export default function StorefrontShell({ children }: StorefrontShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname ? pathname.startsWith("/admin") : false;

  if (isAdmin) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  return (
    <CartProvider>
      <Suspense
        fallback={
          <div className="h-20 bg-[#FFFDF9] border-b border-[#E8DFD8]" />
        }
      >
        <Header />
      </Suspense>
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </CartProvider>
  );
}
