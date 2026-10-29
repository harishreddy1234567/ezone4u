import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function ProductNotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 sm:py-28 text-center space-y-6">
      <div className="w-14 h-14 rounded-full bg-[#F4EFEA] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center mx-auto">
        <Sparkles className="w-6 h-6" />
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.25em] text-[#B88B58] font-medium">
          404 · Item Unavailable
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#2D2723] font-normal tracking-wide">
          Product Not Found
        </h1>
        <p className="text-sm text-[#786E65] leading-relaxed max-w-md mx-auto">
          The requested clothing piece may have been retired or does not exist in our active atelier catalogue.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2D2723] text-[#FAF7F2] text-xs uppercase tracking-wider font-medium hover:bg-[#3C3530] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Explore All Collections</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] text-[#2D2723] text-xs uppercase tracking-wider font-medium hover:bg-[#F4EFEA] transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
