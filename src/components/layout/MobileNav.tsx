"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Search, ChevronRight, ChevronDown, Truck, Sparkles } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch?: () => void;
}

export default function MobileNav({
  isOpen,
  onClose,
  onOpenSearch,
}: MobileNavProps) {
  const pathname = usePathname();
  const [isCatalogueExpanded, setIsCatalogueExpanded] = useState(false);

  // Close when pathname changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#2D2723]/35 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-full max-w-[280px] sm:max-w-xs bg-[#FFFDF9] shadow-warm-xl flex flex-col border-r border-[#E8DFD8] animate-in slide-in-from-left duration-250">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#ECEAE6]">
          <Link
            href="/"
            onClick={onClose}
            className="flex flex-col items-start leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58] rounded"
          >
            <span className="font-serif text-xl tracking-[0.24em] text-[#2D2723] uppercase">
              EZONE4U
            </span>
            <span className="text-[7.5px] tracking-[0.32em] text-[#786E65] uppercase font-light mt-1">
              ATELIER & FASHION
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#786E65] hover:text-[#2D2723] hover:bg-[#F4EFEA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5 text-[#2D2723]" />
          </button>
        </div>

        {/* Primary Collections Navigation */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Search Trigger in Mobile Drawer */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSearch();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] text-[#786E65] border border-[#E8DFD8] text-sm hover:text-[#2D2723] transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-[#B88B58]" />
                <span>Search collection...</span>
              </span>
              <span className="text-xs uppercase text-[#9E958C]">Find</span>
            </button>
          )}

          <nav className="space-y-1.5">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9E958C]">
              Navigation
            </div>

            {/* 1. About Us */}
            <Link
              href="/about"
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium tracking-wide transition-colors ${
                pathname === "/about"
                  ? "bg-[#F4EFEA] text-[#2D2723]"
                  : "text-[#5C534B] hover:bg-[#FAF7F2] hover:text-[#2D2723]"
              }`}
            >
              <span>About Us</span>
              <ChevronRight className="w-4 h-4 text-[#9E958C]" />
            </Link>

            {/* 2. Catalogue Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setIsCatalogueExpanded((prev) => !prev)}
                aria-expanded={isCatalogueExpanded}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium tracking-wide transition-colors ${
                  pathname.startsWith("/shop")
                    ? "bg-[#F4EFEA] text-[#2D2723]"
                    : "text-[#5C534B] hover:bg-[#FAF7F2] hover:text-[#2D2723]"
                }`}
              >
                <span>Catalogue</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#9E958C] transition-transform duration-200 ${
                    isCatalogueExpanded ? "rotate-180 text-[#B88B58]" : ""
                  }`}
                />
              </button>

              {isCatalogueExpanded && (
                <div className="pl-4 pr-1 py-1.5 space-y-1">
                  {/* Exact Order: 1. Kids, 2. Men, 3. Women */}
                  <Link
                    href="/shop?category=kids"
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-colors ${
                      pathname.includes("category=kids")
                        ? "bg-[#F4EFEA] text-[#B88B58] font-semibold"
                        : "text-[#786E65] hover:bg-[#FAF7F2] hover:text-[#2D2723]"
                    }`}
                  >
                    <span>Kids</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#9E958C]" />
                  </Link>

                  <Link
                    href="/shop?category=men"
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-colors ${
                      pathname.includes("category=men")
                        ? "bg-[#F4EFEA] text-[#B88B58] font-semibold"
                        : "text-[#786E65] hover:bg-[#FAF7F2] hover:text-[#2D2723]"
                    }`}
                  >
                    <span>Men</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#9E958C]" />
                  </Link>

                  <Link
                    href="/shop?category=women"
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-colors ${
                      pathname.includes("category=women")
                        ? "bg-[#F4EFEA] text-[#B88B58] font-semibold"
                        : "text-[#786E65] hover:bg-[#FAF7F2] hover:text-[#2D2723]"
                    }`}
                  >
                    <span>Women</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#9E958C]" />
                  </Link>
                </div>
              )}
            </div>

            {/* 3. Contact Us */}
            <Link
              href="/contact"
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium tracking-wide transition-colors ${
                pathname === "/contact"
                  ? "bg-[#F4EFEA] text-[#2D2723]"
                  : "text-[#5C534B] hover:bg-[#FAF7F2] hover:text-[#2D2723]"
              }`}
            >
              <span>Contact Us</span>
              <ChevronRight className="w-4 h-4 text-[#9E958C]" />
            </Link>
          </nav>

          {/* Brand Highlights */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#5C534B]">
              <Truck className="w-4 h-4 text-[#B88B58] shrink-0" />
              <span>Cash on Delivery Nationwide</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#5C534B]">
              <Sparkles className="w-4 h-4 text-[#B88B58] shrink-0" />
              <span>Contemporary Comfort & Fit</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#ECEAE6] bg-[#FAF7F2] text-xs text-[#786E65] text-center">
          © 2026 Ezone4u. All rights reserved.
        </div>
      </div>
    </div>
  );
}
