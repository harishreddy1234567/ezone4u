import React from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Truck, HelpCircle, Mail, MapPin, Navigation } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full space-y-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Home</span>
      </Link>

      <div className="space-y-3 text-center max-w-xl mx-auto">
        <p className="text-xs uppercase tracking-[0.25em] font-medium text-[#B88B58]">
          Client Support
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#2D2723] font-normal tracking-wide">
          We&apos;re Here to Assist You
        </h1>
        <p className="text-sm text-[#786E65] leading-relaxed">
          Questions regarding your order, sizing, or deliveries? Reach out to our
          concierge team.
        </p>
      </div>

      {/* Official Business Contact & Address Card */}
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 sm:p-8 shadow-warm-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B88B58]">
              Atelier & Head Office
            </span>
            <h2 className="font-serif text-2xl text-[#2D2723] font-normal">
              Official Contact Information
            </h2>
            <p className="text-xs text-[#786E65] leading-relaxed">
              For collection inquiries, order support, and business communications,
              contact our atelier directly.
            </p>

            <div className="pt-2 space-y-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#9E958C] font-medium block mb-1">
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
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[11px] uppercase tracking-wider text-[#9E958C] font-medium block">
              Business Address
            </span>
            <div className="flex items-start gap-2.5 text-sm text-[#5C534B]">
              <MapPin className="w-4 h-4 text-[#B88B58] shrink-0 mt-1" />
              <address className="not-italic leading-relaxed text-[#5C534B]">
                Bhyarava Nilaya<br />
                No. 1, Begur Road<br />
                Hongasandra<br />
                Bangalore - 560068<br />
                Karnataka, India
              </address>
            </div>

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
        </div>
      </div>

      {/* Support Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="p-6 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F4EFEA] text-[#B88B58] flex items-center justify-center mx-auto">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-medium text-[#2D2723] text-sm">Customer Inquiries</h3>
          <p className="text-xs text-[#786E65]">
            Our concierge answers order assistance and product questions Monday to Saturday.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F4EFEA] text-[#B88B58] flex items-center justify-center mx-auto">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="font-medium text-[#2D2723] text-sm">Cash on Delivery</h3>
          <p className="text-xs text-[#786E65]">
            Need help with doorstep payment or delivery address updates? We can assist.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F4EFEA] text-[#B88B58] flex items-center justify-center mx-auto">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="font-medium text-[#2D2723] text-sm">Order Status</h3>
          <p className="text-xs text-[#786E65]">
            Track packages anytime using your order reference number.
          </p>
        </div>
      </div>
    </div>
  );
}
