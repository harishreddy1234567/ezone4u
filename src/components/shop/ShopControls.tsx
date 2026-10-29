"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronDown, SlidersHorizontal } from "lucide-react";

interface ShopControlsProps {
  currentCategory?: string;
  currentSearch?: string;
  currentSort?: string;
  totalCount: number;
}

const CATEGORIES = [
  { label: "All Collections", slug: "" },
  { label: "Kids", slug: "kids" },
  { label: "Men", slug: "men" },
  { label: "Women", slug: "women" },
];

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export default function ShopControls({
  currentCategory = "",
  currentSearch = "",
  currentSort = "featured",
  totalCount,
}: ShopControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  function updateQuery(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset to page 1 whenever search, category, or sort changes
    if (!updates.page) {
      params.delete("page");
    }

    startTransition(() => {
      const queryStr = params.toString();
      router.push(`/shop${queryStr ? `?${queryStr}` : ""}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateQuery({ search: searchTerm.trim() || null });
  }

  function handleClearSearch() {
    setSearchTerm("");
    updateQuery({ search: null });
  }

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        {/* Search input form */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-md"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-3 sm:left-3.5 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#786E65] pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search fabrics, colors, styles..."
              className="w-full pl-9 sm:pl-10 pr-16 sm:pr-20 py-2 sm:py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] focus:border-transparent transition-all shadow-warm-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-12 sm:right-14 p-1 text-[#9E958C] hover:text-[#2D2723] transition-colors"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1 sm:right-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[#2D2723] text-[#FAF7F2] text-[10px] sm:text-[11px] uppercase tracking-wider font-medium hover:bg-[#3C3530] transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Sorting Dropdown & Total Count indicator */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <div className="text-xs text-[#786E65] font-light">
            <span>{totalCount} {totalCount === 1 ? "piece" : "pieces"}</span>
          </div>

          <div className="relative flex items-center gap-2">
            <label htmlFor="shop-sort" className="sr-only">
              Sort by
            </label>
            <div className="relative">
              <select
                id="shop-sort"
                value={currentSort}
                onChange={(e) => updateQuery({ sort: e.target.value })}
                className="appearance-none pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 sm:py-2 rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] text-xs font-medium text-[#2D2723] focus:outline-none focus:ring-2 focus:ring-[#B88B58] cursor-pointer shadow-warm-xs transition-colors hover:border-[#B88B58]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#786E65] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills & Active Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#ECEAE6]">
        {/* Category switcher pills (Horizontal scrollable on mobile like Myntra, wrap on tablet/desktop) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap no-scrollbar max-w-full">
          {CATEGORIES.map((cat) => {
            const isActive =
              cat.slug === ""
                ? !currentCategory
                : currentCategory.toLowerCase() === cat.slug;

            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => updateQuery({ category: cat.slug || null })}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#2D2723] text-[#FAF7F2] shadow-warm-xs"
                    : "bg-[#FFFDF9] text-[#5C534B] border border-[#E8DFD8] hover:bg-[#F4EFEA] hover:text-[#2D2723]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Clear Filters indicator if any active */}
        {(currentCategory || currentSearch || currentSort !== "featured") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              updateQuery({ category: null, search: null, sort: null });
            }}
            className="inline-flex items-center gap-1.5 text-xs text-[#786E65] hover:text-[#B88B58] transition-colors underline underline-offset-4 decoration-[#E8DFD8]"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
