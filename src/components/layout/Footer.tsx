import React from "react";
import Link from "next/link";
import { Truck, ShieldCheck, RefreshCw, Sparkles, Mail, MapPin, Navigation } from "lucide-react";

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="bg-[#F4EFEA] border-t border-[#E8DFD8] text-[#5C534B]">
      {/* Trust & Value Pillars */}
      <div className="border-b border-[#E8DFD8] bg-[#FAF7F2]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#E2EAE2] text-[#4A634E] shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#2D2723]">
                  Cash on Delivery
                </h4>
                <p className="text-xs text-[#786E65] mt-0.5">
                  Convenient pay-at-doorstep service across India.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#FAEDE5] text-[#8C5F43] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#2D2723]">
                  Artisanal Quality
                </h4>
                <p className="text-xs text-[#786E65] mt-0.5">
                  Breathable cottons, pure linen, and curated pastel tones.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#E7EDF3] text-[#4C657E] shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#2D2723]">
                  Hassle-Free Exchanges
                </h4>
                <p className="text-xs text-[#786E65] mt-0.5">
                  Easy size and item exchanges within 7 days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#F9EBEA] text-[#874F4C] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#2D2723]">
                  Conscious Fashion
                </h4>
                <p className="text-xs text-[#786E65] mt-0.5">
                  Timeless silhouettes crafted for longevity and ease.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand & Mission column (spans 6 cols on md & lg) */}
          <div className="md:col-span-6 lg:col-span-6 space-y-4">
            <Link href="/" className="inline-block">
              <div className="flex flex-col">
                <span className="font-serif text-2xl tracking-[0.2em] text-[#2D2723] uppercase">
                  Ezone4u
                </span>
                <span className="text-[9px] tracking-[0.3em] text-[#786E65] uppercase">
                  Atelier & Fashion
                </span>
              </div>
            </Link>
            <p className="text-sm text-[#786E65] leading-relaxed max-w-sm">
              Ezone4u brings effortless contemporary elegance to modern wardrobes.
              Thoughtfully designed with natural textures, relaxing pastel
              palettes, and comfortable cuts for all moments.
            </p>
            <div className="pt-2 text-xs text-[#9E958C]">
              <span>Curated in India • Delivered with Care</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 lg:col-span-3 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2D2723]">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-[#786E65] hover:text-[#2D2723] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="text-[#786E65] hover:text-[#2D2723] transition-colors"
                >
                  Shop Catalogue
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-[#786E65] hover:text-[#2D2723] transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-[#786E65] hover:text-[#2D2723] transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Shop Categories */}
          <div className="md:col-span-3 lg:col-span-3 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2D2723]">
              Categories
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/shop?category=men"
                  className="text-[#786E65] hover:text-[#2D2723] transition-colors"
                >
                  Men
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=women"
                  className="text-[#786E65] hover:text-[#2D2723] transition-colors"
                >
                  Women
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=kids"
                  className="text-[#786E65] hover:text-[#2D2723] transition-colors"
                >
                  Kids
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Official Contact & Business Location */}
        <div className="mt-12 pt-10 border-t border-[#E8DFD8]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Contact Details & Address */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B88B58]">
                  Atelier & Head Office
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-[#2D2723] font-normal mt-1">
                  Official Contact & Location
                </h3>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-[#9E958C] font-medium block">
                  Email
                </span>
                <a
                  href="mailto:info@ezone4u.com"
                  className="inline-flex items-center gap-2 text-sm text-[#2D2723] hover:text-[#B88B58] transition-colors group"
                >
                  <Mail className="w-4 h-4 text-[#B88B58] group-hover:scale-110 transition-transform" />
                  <span className="font-medium underline underline-offset-4 decoration-[#E8DFD8] group-hover:decoration-[#B88B58]">
                    info@ezone4u.com
                  </span>
                </a>
              </div>

              {/* Business Address */}
              <div className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider text-[#9E958C] font-medium block">
                  Business Address
                </span>
                <div className="flex items-start gap-2 text-sm text-[#5C534B]">
                  <MapPin className="w-4 h-4 text-[#B88B58] shrink-0 mt-1" />
                  <address className="not-italic leading-relaxed text-[#5C534B]">
                    Bhyarava Nilaya<br />
                    No. 1, Begur Road<br />
                    Hongasandra<br />
                    Bangalore - 560068<br />
                    Karnataka, India
                  </address>
                </div>
              </div>

              {/* Get Directions Button */}
              <div className="pt-2">
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Bhyarava+Nilaya,+No.+1,+Begur+Road,+Hongasandra,+Bangalore+-+560068,+Karnataka,+India"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D2723] text-[#FAF7F2] hover:bg-[#3C3530] text-xs uppercase tracking-wider font-medium transition-all shadow-warm-xs"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#B88B58]" />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>

            {/* Google Maps Embed */}
            <div className="lg:col-span-7">
              <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-[#E8DFD8] bg-[#FFFDF9] shadow-warm-xs">
                <iframe
                  title="Ezone4u Official Business Location - Bhyarava Nilaya, Begur Road, Hongasandra, Bangalore"
                  src="https://maps.google.com/maps?q=Bhyarava+Nilaya,+No.+1,+Begur+Road,+Hongasandra,+Bangalore+-+560068,+Karnataka,+India&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#E8DFD8] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#786E65]">
          <p>© {currentYear} Ezone4u. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-[#9E958C]">
            <span>Exclusively Cash on Delivery</span>
            <span>•</span>
            <span>Handcrafted Elegance</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
