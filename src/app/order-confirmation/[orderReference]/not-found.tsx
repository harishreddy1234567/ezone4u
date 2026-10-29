import React from "react";
import Link from "next/link";
import { PackageX, ArrowLeft } from "lucide-react";

export default function OrderNotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-[#F4EFEA] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center mx-auto">
        <PackageX className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="font-serif text-3xl text-[#2D2723]">Order Not Found</h1>
        <p className="text-sm text-[#786E65] leading-relaxed">
          We could not locate an order matching that reference code. Please verify the link or check
          the reference code provided when your order was placed.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D2723] text-[#FAF7F2] text-xs uppercase tracking-wider font-medium hover:bg-[#3C3530] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Collection</span>
        </Link>
      </div>
    </div>
  );
}
