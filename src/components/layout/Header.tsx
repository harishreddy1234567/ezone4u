"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, Menu, Sparkles, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import SearchModal from "@/components/layout/SearchModal";
import MobileNav from "@/components/layout/MobileNav";

export default function Header() {
  const pathname = usePathname();
  const { cartCount, setIsCartDrawerOpen } = useCart();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
  const catalogueRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        catalogueRef.current &&
        !catalogueRef.current.contains(event.target as Node)
      ) {
        setIsCatalogueOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCatalogueOpen(false);
      }
    }

    if (isCatalogueOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCatalogueOpen]);

  // Close dropdown on route change without useEffect cascading render
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsCatalogueOpen(false);
  }

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-[#F4EFEA] border-b border-[#E8DFD8] text-[#5C534B] text-[11px] sm:text-xs py-2 px-4 text-center tracking-wider">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 sm:gap-2">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#B88B58] shrink-0" />
          <span className="font-medium truncate">
            Contemporary Fashion · Cash on Delivery Available Nationwide
          </span>
        </div>
      </div>

      {/* Main Single-Row Header */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD8] transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* FAR LEFT: Brand Wordmark */}
            <div className="flex items-center">
              <Link
                href="/"
                className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58] rounded py-1"
                aria-label="Ezone4u Home"
              >
                <div className="flex flex-col items-start leading-none">
                  <span className="font-serif text-xl sm:text-2xl md:text-3xl tracking-[0.18em] sm:tracking-[0.24em] text-[#2D2723] uppercase font-normal group-hover:text-[#8C5A2B] transition-colors">
                    EZONE4U
                  </span>
                  <span className="text-[7.5px] sm:text-[9px] tracking-[0.32em] sm:tracking-[0.38em] text-[#786E65] uppercase font-light mt-0.5 sm:mt-1">
                    ATELIER & FASHION
                  </span>
                </div>
              </Link>
            </div>

            {/* FAR RIGHT: Desktop Navigation (1. About Us | 2. Catalogue | 3. Contact Us | 4. Search | 5. Shopping Bag) */}
            <nav className="hidden md:flex items-center space-x-7 lg:space-x-8 text-sm font-medium tracking-wider">
              {/* 1. About Us */}
              <Link
                href="/about"
                className={`py-1 uppercase text-xs tracking-[0.16em] transition-colors hover:text-[#B88B58] relative ${
                  pathname === "/about"
                    ? "text-[#2D2723] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[#B88B58]"
                    : "text-[#5C534B]"
                }`}
              >
                About Us
              </Link>

              {/* 2. Catalogue Dropdown */}
              <div ref={catalogueRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsCatalogueOpen((prev) => !prev)}
                  aria-expanded={isCatalogueOpen}
                  aria-haspopup="true"
                  aria-controls="catalogue-dropdown"
                  id="catalogue-button"
                  className={`inline-flex items-center gap-1.5 py-1 uppercase text-xs tracking-[0.16em] transition-colors hover:text-[#B88B58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58] rounded relative ${
                    pathname.startsWith("/shop")
                      ? "text-[#2D2723] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[#B88B58]"
                      : "text-[#5C534B]"
                  }`}
                >
                  <span>Catalogue</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#786E65] transition-transform duration-200 ${
                      isCatalogueOpen ? "rotate-180 text-[#B88B58]" : ""
                    }`}
                  />
                </button>

                {isCatalogueOpen && (
                  <div
                    id="catalogue-dropdown"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="catalogue-button"
                    className="absolute top-full left-0 mt-3 w-44 rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    {/* Exact Order: 1. Kids, 2. Men, 3. Women */}
                    <Link
                      href="/shop?category=kids"
                      role="menuitem"
                      onClick={() => setIsCatalogueOpen(false)}
                      className={`block px-4 py-2.5 text-xs uppercase tracking-[0.14em] font-medium transition-colors hover:bg-[#F4EFEA] hover:text-[#B88B58] ${
                        pathname.includes("category=kids")
                          ? "text-[#B88B58] font-semibold bg-[#FAF7F2]"
                          : "text-[#2D2723]"
                      }`}
                    >
                      Kids
                    </Link>
                    <Link
                      href="/shop?category=men"
                      role="menuitem"
                      onClick={() => setIsCatalogueOpen(false)}
                      className={`block px-4 py-2.5 text-xs uppercase tracking-[0.14em] font-medium transition-colors hover:bg-[#F4EFEA] hover:text-[#B88B58] ${
                        pathname.includes("category=men")
                          ? "text-[#B88B58] font-semibold bg-[#FAF7F2]"
                          : "text-[#2D2723]"
                      }`}
                    >
                      Men
                    </Link>
                    <Link
                      href="/shop?category=women"
                      role="menuitem"
                      onClick={() => setIsCatalogueOpen(false)}
                      className={`block px-4 py-2.5 text-xs uppercase tracking-[0.14em] font-medium transition-colors hover:bg-[#F4EFEA] hover:text-[#B88B58] ${
                        pathname.includes("category=women")
                          ? "text-[#B88B58] font-semibold bg-[#FAF7F2]"
                          : "text-[#2D2723]"
                      }`}
                    >
                      Women
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. Contact Us */}
              <Link
                href="/contact"
                className={`py-1 uppercase text-xs tracking-[0.16em] transition-colors hover:text-[#B88B58] relative ${
                  pathname === "/contact"
                    ? "text-[#2D2723] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[#B88B58]"
                    : "text-[#5C534B]"
                }`}
              >
                Contact Us
              </Link>

              {/* 4. Search Control */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-[#5C534B] hover:text-[#2D2723] hover:bg-[#F4EFEA] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
                aria-label="Open search catalogue"
              >
                <Search className="w-5 h-5 text-[#2D2723]" />
              </button>

              {/* 5. Shopping Bag */}
              <Link
                href="/cart"
                onClick={(e) => {
                  if (pathname === "/cart") {
                    e.preventDefault();
                    setIsCartDrawerOpen(true);
                  }
                }}
                className="relative p-2 text-[#5C534B] hover:text-[#2D2723] hover:bg-[#F4EFEA] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
                aria-label={`Shopping bag with ${cartCount} items`}
              >
                <ShoppingBag className="w-5 h-5 text-[#2D2723]" />
                <span className="absolute -top-1 -right-1 bg-[#B88B58] text-[#FFFDF9] text-[10px] font-semibold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              </Link>
            </nav>

            {/* FAR RIGHT: Mobile Controls (Search, Shopping bag, Menu button) */}
            <div className="flex md:hidden items-center space-x-1 sm:space-x-2">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-1.5 sm:p-2 text-[#5C534B] hover:text-[#2D2723] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
                aria-label="Search catalogue"
              >
                <Search className="w-5 h-5 text-[#2D2723]" />
              </button>

              <Link
                href="/cart"
                className="relative p-1.5 sm:p-2 text-[#5C534B] hover:text-[#2D2723] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
                aria-label={`Shopping bag with ${cartCount} items`}
              >
                <ShoppingBag className="w-5 h-5 text-[#2D2723]" />
                <span className="absolute -top-0.5 -right-0.5 bg-[#B88B58] text-[#FFFDF9] text-[10px] font-semibold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1.5 sm:p-2 text-[#5C534B] hover:text-[#2D2723] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-[#2D2723]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Accessible Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />
    </>
  );
}
