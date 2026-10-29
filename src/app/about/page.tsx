import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Truck, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full space-y-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Home</span>
      </Link>

      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-[0.25em] font-medium text-[#B88B58]">
          Our Atelier
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl text-[#2D2723] font-normal tracking-wide leading-tight">
          Everyday Style, Thoughtfully Chosen
        </h1>
        <p className="text-base sm:text-lg text-[#5C534B] leading-relaxed font-light">
          At Ezone4u, we believe getting dressed should feel effortless. Explore
          contemporary styles that bring together comfort, versatility, and a
          refined everyday look.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="p-6 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#F4EFEA] text-[#B88B58] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-lg text-[#2D2723]">Natural Comfort</h2>
          <p className="text-xs sm:text-sm text-[#786E65] leading-relaxed">
            Thoughtful clothing created for easy living, using breathable
            cottons, relaxed linens, and calm pastel tones.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#F4EFEA] text-[#B88B58] flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-lg text-[#2D2723]">Nationwide Service</h2>
          <p className="text-xs sm:text-sm text-[#786E65] leading-relaxed">
            Convenient Cash on Delivery across India, delivering refined everyday
            fashion directly to your doorstep.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#F4EFEA] text-[#B88B58] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-lg text-[#2D2723]">Curated Editions</h2>
          <p className="text-xs sm:text-sm text-[#786E65] leading-relaxed">
            Focused collections for Men, Women, and Kids with clean cuts that
            complement modern wardrobes season after season.
          </p>
        </div>
      </div>
    </div>
  );
}
