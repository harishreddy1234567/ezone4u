"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  "Linen Shirts",
  "Pastel Cotton Dresses",
  "Warm Beige Co-ords",
  "Relaxed Fit Trousers",
  "Minimalist Kurtas",
  "Classic Overcoats",
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    handleClose();
    router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
  };

  const handleSuggestionClick = (term: string) => {
    handleClose();
    router.push(`/shop?search=${encodeURIComponent(term)}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-[#2D2723]/30 backdrop-blur-sm transition-opacity"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FFFDF9] rounded-2xl border border-[#E8DFD8] shadow-warm-xl p-4 sm:p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#ECEAE6]">
          <h2 className="text-sm uppercase tracking-wider text-[#786E65] font-medium">
            Search Catalogue
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full text-[#786E65] hover:text-[#2D2723] hover:bg-[#F4EFEA] transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-[#9E958C]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fabrics, colors, styles (e.g. linen, pastel, shirt)..."
              className="w-full pl-12 pr-12 py-3.5 bg-[#FAF7F2] text-[#2D2723] placeholder-[#9E958C] rounded-xl border border-[#E8DFD8] text-base focus:border-[#B88B58] focus:bg-[#FFFDF9] transition-all"
            />
            {query.trim() && (
              <button
                type="submit"
                className="absolute right-3 p-1.5 rounded-lg bg-[#B88B58] text-[#FFFDF9] hover:bg-[#A07444] transition-colors"
                aria-label="Submit search"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-[#9E958C] mb-3">
            Popular Searches
          </p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleSuggestionClick(term)}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[#F4EFEA] text-[#5C534B] hover:bg-[#E8DFD8] hover:text-[#2D2723] border border-[#E8DFD8] transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
